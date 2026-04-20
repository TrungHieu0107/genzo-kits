import { invoke } from '@tauri-apps/api/core';

export interface LogEntry {
  rawLog: string;
  type: 'sql' | 'info' | 'other';
  id?: string;
  sql?: string;
  paramsString?: string;
  reconstructedSql?: string;
  timestamp?: string;
  logIndex: number;
}

export interface DaoSession {
  daoName: string;
  threadName: string;
  logs: LogEntry[];
}

export async function parseSqlLogsAsync(logContent: string): Promise<DaoSession[]> {
  try {
    return await invoke<DaoSession[]>('parse_sql_logs_rust', { logContent });
  } catch (error) {
    console.error('Rust SQL Parsing failed, falling back to JS:', error);
    return parseSqlLogs(logContent);
  }
}

export function parseSqlLogs(logContent: string): DaoSession[] {
  // ... (keeping existing logic as fallback for now)
  const sessions: DaoSession[] = [];
  const threadStacks: Record<string, DaoSession[]> = {}; // threadName -> array of DaoSession (stack)

  // Split log by standard log timestamp to get full multiline entries
  const entryRegex = /(^\d{4}[\/-]\d{2}[\/-]\d{2}\s+\d{2}:\d{2}:\d{2},.*?)(?=^\d{4}[\/-]\d{2}[\/-]\d{2}\s+\d{2}:\d{2}:\d{2},|\z)/gms;
  
  let match;
  let logIndexCount = 0;
  while ((match = entryRegex.exec(logContent)) !== null) {
    const rawEntry = match[1].trim();
    if (!rawEntry) continue;

    const currentLogIndex = logIndexCount++;
    // Extract Timestamp
    const timeMatch = rawEntry.match(/^(\d{4}[\/-]\d{2}[\/-]\d{2}\s+\d{2}:\d{2}:\d{2})/);
    const timestamp = timeMatch ? timeMatch[1] : '';

    // 1. Check for DAO Start
    // Use \w. and support various prefix styles (with or without spaces/commas)
    const startDaoMatch = rawEntry.match(/(?:InvokeDao)?.*?,?Daoの開始\s*([\w.]+)/i);
    if (startDaoMatch) {
      const fullDaoName = startDaoMatch[1];
      const daoName = fullDaoName.split('.').pop() || fullDaoName;
      const threadMatch = rawEntry.match(/threadName=([\w-]+)/);
      const threadName = threadMatch ? threadMatch[1] : 'main';
      
      if (!threadStacks[threadName]) threadStacks[threadName] = [];
      const newSession: DaoSession = { daoName, threadName, logs: [] };
      newSession.logs.push({ rawLog: rawEntry, type: 'info', timestamp, logIndex: currentLogIndex });
      threadStacks[threadName].push(newSession); // Push new session to stack
      continue;
    }

    // Determine target thread
    let targetThread: string | null = null;
    const threadNameMatch = rawEntry.match(/threadName=([\w-]+)/);
    
    // Prefer explicitly named thread if it has an active session
    if (threadNameMatch && threadStacks[threadNameMatch[1]] && threadStacks[threadNameMatch[1]].length > 0) {
      targetThread = threadNameMatch[1];
    } else {
      // Fallback: pick the first thread that has an active session (exclude unknown if possible)
      const activeThreads = Object.keys(threadStacks).filter(k => threadStacks[k].length > 0 && k !== 'unknown');
      if (activeThreads.length > 0) {
        targetThread = activeThreads[0];
      } else if (threadStacks['unknown'] && threadStacks['unknown'].length > 0) {
        targetThread = 'unknown';
      }
    }

    // 2. Check for DAO End
    const isDaoEnd = rawEntry.match(/Daoの終了\s*([\w.]+)/i);
    const isSessionEnd = /(?:endSession|Daoのセッションを終了します)/i.test(rawEntry);
    
    if (isDaoEnd || isSessionEnd) {
      let threadToPop = targetThread;
      if (threadNameMatch && threadStacks[threadNameMatch[1]] && threadStacks[threadNameMatch[1]].length > 0) {
        threadToPop = threadNameMatch[1];
      }
      
      if (threadToPop && threadStacks[threadToPop] && threadStacks[threadToPop].length > 0) {
        const finishedSession = threadStacks[threadToPop].pop()!;
        finishedSession.logs.push({ rawLog: rawEntry, type: 'info', timestamp, logIndex: currentLogIndex });
        sessions.push(finishedSession);
      }
      continue;
    }

    // 3. Process SQL and Params
    let logEntry: LogEntry = { rawLog: rawEntry, type: 'other', timestamp, logIndex: currentLogIndex };

    // Regex improvement: search for ID, SQL, and Params independently to handle mixed lines
    const idMatch = rawEntry.match(/id=([a-zA-Z0-9_-]+)/i);
    const sqlMatch = rawEntry.match(/sql=([\s\S]*)/i);
    const paramsMatch = rawEntry.match(/params=\s*(\[[\s\S]*\]|.*)/is);

    if (idMatch) {
      logEntry.id = idMatch[1].trim().toLowerCase();
      
      if (sqlMatch) {
        logEntry.type = 'sql';
        logEntry.sql = sqlMatch[1].trim();
      }
      
      if (paramsMatch) {
        logEntry.type = 'sql';
        // If we already have sql, this log holds both. If not, it's just params.
        logEntry.paramsString = paramsMatch[1].trim();
      }
    }

    // Push to appropriate session stack
    if (targetThread && threadStacks[targetThread] && threadStacks[targetThread].length > 0) {
       const currentSession = threadStacks[targetThread][threadStacks[targetThread].length - 1];
       currentSession.logs.push(logEntry);
    } else {
       if (!threadStacks['unknown']) threadStacks['unknown'] = [];
       if (threadStacks['unknown'].length === 0) {
         threadStacks['unknown'].push({ daoName: 'Unknown/Global', threadName: 'unknown', logs: [] });
       }
       threadStacks['unknown'][threadStacks['unknown'].length - 1].logs.push(logEntry);
    }
  }

  // Push remaining un-closed sessions
  for (const threadName in threadStacks) {
    while (threadStacks[threadName].length > 0) {
      sessions.push(threadStacks[threadName].pop()!);
    }
  }

  // SECOND PASS: Reconstruct SQL queries globally
  const globalSqlMap = new Map<string, string>(); // id -> sql
  const executedIds = new Set<string>(); // IDs that have at least one paramsString

  // Collect mappings
  for (const session of sessions) {
    for (const log of session.logs) {
      if (log.id && log.type === 'sql') {
         // Normalized ID normalization (redundant but safe)
         const normId = log.id.trim().toLowerCase();
         if (log.sql) globalSqlMap.set(normId, log.sql);
         if (log.paramsString !== undefined) executedIds.add(normId);
      }
    }
  }

  // Reconstruct correctly mapping every execute parameters log to the base sql statement
  for (const session of sessions) {
    for (const log of session.logs) {
      if (log.type === 'sql' && log.id) {
        const normId = log.id.trim().toLowerCase();
        const rawSql = globalSqlMap.get(normId);
        
        if (rawSql) {
          if (log.paramsString !== undefined) {
             // This is an execution log with parameters -> yield formatted full SQL
             log.reconstructedSql = reconstructSql(rawSql, log.paramsString);
          } else if (log.sql) {
             // This is a prepare statement log. ALWAYS hide it from the SQL list.
             // We ONLY want to show statements when they are executed (`params=` is present).
             log.type = 'info'; 
             log.reconstructedSql = undefined;
          }
        }
      }
    }
  }

  return sessions;
}

function reconstructSql(sql: string, paramsString: string): string {
  if (!paramsString) return sql;

  // Robustly parse params: split by '][' but handle potential surrounding brackets
  const paramItems = paramsString.split(/\]\s*\[/);
  const paramDict: Record<number, string> = {};

  paramItems.forEach(item => {
    // Clean up potential leftover brackets
    item = item.trim().replace(/^\[|\]$/g, '');
    
    // Split by colons: TYPE:INDEX:VALUE
    const parts = item.split(':');
    if (parts.length >= 3) {
      const type = parts[0].trim();
      const index = parseInt(parts[1], 10);
      const value = parts.slice(2).join(':').trim(); // Rejoin value parts

      let formattedValue = value;
      if (type === 'STRING' || type === 'DATE' || type === 'TIMESTAMP') {
        formattedValue = `'${value.replace(/'/g, "''")}'`;
      } else if (type === 'NULL' || value.toUpperCase() === 'NULL') {
        formattedValue = 'NULL';
      }

      if (!isNaN(index)) {
        paramDict[index] = formattedValue;
      }
    }
  });

  // Replace '?' iteratively using a safe non-backtracking replace
  let questionMarkCount = 0;
  let finalSql = sql.replace(/\?/g, () => {
    questionMarkCount++;
    if (paramDict[questionMarkCount] !== undefined) {
      return paramDict[questionMarkCount];
    }
    return '?';
  });

  // DO NOT compress all spaces here, keep formatting but trim exterior
  return finalSql.trim();
}
