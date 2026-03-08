export interface LogEntry {
  rawLog: string;
  type: 'sql' | 'info' | 'other';
  id?: string;
  sql?: string;
  paramsString?: string;
  reconstructedSql?: string;
}

export interface DaoSession {
  daoName: string;
  threadName: string;
  logs: LogEntry[];
}

export function parseSqlLogs(logContent: string): DaoSession[] {
  const sessions: DaoSession[] = [];
  let currentSessions: Record<string, DaoSession> = {}; // threadName -> DaoSession

  // Split log by standard log timestamp to get full multiline entries
  // e.g. "2026/01/29 19:16:13,INFO,..."
  const entryRegex = /(^\d{4}\/\d{2}\/\d{2}\s+\d{2}:\d{2}:\d{2},.*?)(?=^\d{4}\/\d{2}\/\d{2}\s+\d{2}:\d{2}:\d{2},|\z)/gms;
  
  let match;
  while ((match = entryRegex.exec(logContent)) !== null) {
    const rawEntry = match[1].trim();
    if (!rawEntry) continue;

    // 1. Check for DAO Start
    // Example: InvokeDao ,Daoの開始jp.co.vinculumjapan.swc.commons.resorces.SystemNamePropertyDao threadName=main
    const startDaoMatch = rawEntry.match(/InvokeDao.*?([\w.]+Dao)\s+threadName=([\w-]+)/i) || 
                          rawEntry.match(/Daoの開始.*?([\w.]+Dao)\s+threadName=([\w-]+)/i);
    if (startDaoMatch) {
      const fullDaoName = startDaoMatch[1];
      const daoName = fullDaoName.split('.').pop() || fullDaoName;
      const threadName = startDaoMatch[2];
      currentSessions[threadName] = { daoName, threadName, logs: [] };
      currentSessions[threadName].logs.push({ rawLog: rawEntry, type: 'info' });
      continue;
    }

    // Identify thread string from the log to group it (often we don't have it on every line, but let's assume single thread or we just append to the most recently active session if threadName isn't clear)
    // If there is no thread mapping, we just put it in a "Global" session if we wanted, but the prompt says: "All logs... between InvokeDao and endSession for the same thread"
    // For simplicity, if we find a threadName=... we use it. If not, we append to the first open session (or last active).
    let targetThread = Object.keys(currentSessions)[0];
    const threadNameMatch = rawEntry.match(/threadName=([\w-]+)/);
    if (threadNameMatch && currentSessions[threadNameMatch[1]]) {
      targetThread = threadNameMatch[1];
    }

    // 2. Check for DAO End
    const endDaoMatch = rawEntry.match(/endSession.*threadName=([\w-]+)/i) || 
                        rawEntry.match(/Daoのセッションを終了します.*threadName=([\w-]+)/i);
    if (endDaoMatch) {
      const threadName = endDaoMatch[1];
      if (currentSessions[threadName]) {
        currentSessions[threadName].logs.push({ rawLog: rawEntry, type: 'info' });
        sessions.push(currentSessions[threadName]);
        delete currentSessions[threadName];
      }
      continue;
    }

    // 3. Process SQL and Params
    let logEntry: LogEntry = { rawLog: rawEntry, type: 'other' };

    // Find sql=...
    const sqlMatch = rawEntry.match(/id=([a-zA-Z0-9_-]+)\s+sql=([\s\S]*)/i);
    if (sqlMatch) {
      logEntry.type = 'sql';
      logEntry.id = sqlMatch[1];
      logEntry.sql = sqlMatch[2].trim();
    } else {
      // Find params=...
      const paramsMatch = rawEntry.match(/id=([a-zA-Z0-9_-]+)\s+.*?params=\[(.*)\]/i);
      if (paramsMatch) {
        logEntry.type = 'sql';
        logEntry.id = paramsMatch[1];
        logEntry.paramsString = paramsMatch[2];
      }
    }

    // Push to appropriate session
    if (targetThread && currentSessions[targetThread]) {
       currentSessions[targetThread].logs.push(logEntry);
    } else {
       // If no active DAO session, we could create an "Unknown DAO" session or ignore.
       // Let's create an 'Unknown' to not lose data.
       if (!currentSessions['unknown']) {
         currentSessions['unknown'] = { daoName: 'Unknown/Global', threadName: 'unknown', logs: [] };
       }
       currentSessions['unknown'].logs.push(logEntry);
    }
  }

  // Push remaining un-closed sessions
  for (const key in currentSessions) {
    sessions.push(currentSessions[key]);
  }

  // SECOND PASS: Reconstruct SQL queries within each session by matching IDs
  for (const session of sessions) {
    const sqlMap = new Map<string, string>(); // id -> sql
    const paramMap = new Map<string, string>(); // id -> paramsString

    // Extract all SQLs and Params
    for (const log of session.logs) {
      if (log.id && log.sql) sqlMap.set(log.id, log.sql);
      if (log.id && log.paramsString) paramMap.set(log.id, log.paramsString);
    }

    // Reconstruct
    for (const log of session.logs) {
      if (log.type === 'sql' && log.id && sqlMap.has(log.id)) {
        let rawSql = sqlMap.get(log.id)!;
        const paramStr = paramMap.get(log.id);

        if (paramStr && rawSql.includes('?')) {
          log.reconstructedSql = reconstructSql(rawSql, paramStr);
        } else {
          log.reconstructedSql = rawSql; // Just the raw SQL if no params
        }
      }
    }
  }

  return sessions;
}

function reconstructSql(sql: string, paramsString: string): string {
  // Parse params string e.g. [STRING:1:VALUE1][NUMBER:2:100][NULL:3:null]
  // The string is essentially "STRING:1:VALUE1][NUMBER:2:100" if we strip outer brackets
  const paramItems = paramsString.split('][');
  
  const paramDict: Record<number, string> = {};

  paramItems.forEach(item => {
    // Clean up potential leftover brackets
    item = item.replace(/^\[|\]$/g, '');
    
    // Split by first two colons: TYPE:INDEX:VALUE
    const parts = item.split(':');
    if (parts.length >= 3) {
      const type = parts[0];
      const index = parseInt(parts[1], 10);
      const value = parts.slice(2).join(':'); // Rejoin in case value contains colon

      let formattedValue = value;
      if (type === 'STRING' || type === 'DATE' || type === 'TIMESTAMP') {
        formattedValue = `'${value.replace(/'/g, "''")}'`;
      } else if (type === 'NULL' || value.toUpperCase() === 'NULL') {
        formattedValue = 'NULL';
      }
      // For NUMBER, leave as is

      paramDict[index] = formattedValue;
    }
  });

  // Replace '?' iteratively
  let questionMarkCount = 0;
  let finalSql = sql.replace(/\?/g, () => {
    questionMarkCount++;
    if (paramDict[questionMarkCount] !== undefined) {
      return paramDict[questionMarkCount];
    }
    return '?'; // fallback if not found
  });

  // Format SQL lightly (just replace some multiple spaces to keep it clean)
  return finalSql.replace(/\s+/g, ' ').trim();
}
