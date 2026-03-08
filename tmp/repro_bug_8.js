
function reconstructSql(sql, paramsString) {
  if (!paramsString) return sql;
  const paramItems = paramsString.split(/\]\s*\[/);
  const paramDict = {};
  paramItems.forEach(item => {
    item = item.trim().replace(/^\[|\]$/g, '');
    const parts = item.split(':');
    if (parts.length >= 3) {
      const type = parts[0].trim();
      const index = parseInt(parts[1], 10);
      const value = parts.slice(2).join(':').trim();
      let formattedValue = value;
      if (type === 'STRING' || type === 'DATE' || type === 'TIMESTAMP') {
        formattedValue = "'" + value.replace(/'/g, "''") + "'";
      } else if (type === 'NULL' || value.toUpperCase() === 'NULL') {
        formattedValue = 'NULL';
      }
      if (!isNaN(index)) paramDict[index] = formattedValue;
    }
  });

  let questionMarkCount = 0;
  let finalSql = sql.replace(/\?/g, () => {
    questionMarkCount++;
    if (paramDict[questionMarkCount] !== undefined) return paramDict[questionMarkCount];
    return '?';
  });
  return finalSql.trim();
}

const lines = [
  "2026/01/29 21:44:08,DEBUG,commons.dao.PreparedStatementEx,<init>              ,CreatePreparedStatement id=781e7326   sql= INSERT INTO DT_EOS_HACHU_MEI( COMP_CD ) VALUES ( ? )",
  "2026/01/29 21:56:37,INFO,commons.dao.PreparedStatementEx,executeQuery        ,PreparedStatement.executeQuery() id=781e7326  params="
];

function testParserLogic() {
  const sessions = [
    {
      daoName: 'TestDao',
      logs: []
    }
  ];

  for (let i = 0; i < lines.length; i++) {
    const rawEntry = lines[i];
    let logEntry = { rawLog: rawEntry, type: 'other', id: undefined, sql: undefined, paramsString: undefined };

    const idMatch = rawEntry.match(/id=([a-zA-Z0-9_-]+)/i);
    const sqlMatch = rawEntry.match(/sql=([\s\S]*)/i);
    const paramsMatch = rawEntry.match(/params=\s*(\[[\s\S]*\]|.*)/is);

    if (idMatch) {
      logEntry.id = idMatch[1].trim().toLowerCase();
      if (sqlMatch) {
        logEntry.type = 'sql';
        logEntry.sql = sqlMatch[1].trim();
      }
      if (paramsMatch && paramsMatch[1] !== undefined) {
        logEntry.type = 'sql';
        logEntry.paramsString = paramsMatch[1].trim();
      }
    }
    sessions[0].logs.push(logEntry);
  }

  const globalSqlMap = new Map();
  const executedIds = new Set();

  for (const session of sessions) {
    for (const log of session.logs) {
      if (log.id && log.type === 'sql') {
         const normId = log.id.trim().toLowerCase();
         if (log.sql) globalSqlMap.set(normId, log.sql);
         if (log.paramsString !== undefined) executedIds.add(normId);
      }
    }
  }

  console.log("Executed IDs:", Array.from(executedIds));

  const results = [];
  for (const session of sessions) {
    for (const log of session.logs) {
      if (log.type === 'sql' && log.id) {
        const normId = log.id.trim().toLowerCase();
        const rawSql = globalSqlMap.get(normId);
        
        if (rawSql) {
          if (log.paramsString !== undefined) {
             log.reconstructedSql = reconstructSql(rawSql, log.paramsString);
          } else if (log.sql) {
             if (executedIds.has(normId)) {
                log.type = 'info'; 
                log.reconstructedSql = undefined;
             } else {
                log.reconstructedSql = rawSql;
             }
          }
        }
      }
      if (log.type === 'sql' && log.reconstructedSql) {
         results.push(log);
      }
    }
  }

  console.log("Final SQL Logs Count:", results.length);
  results.forEach(r => console.log("Log ID:", r.id, "| Reconstructed:", r.reconstructedSql));
}

testParserLogic();
