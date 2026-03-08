
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

function testMixedCaseIds() {
  const sessions = [
    {
      daoName: 'TestDao',
      logs: [
        { type: 'sql', id: '4D-AC', sql: 'INSERT INTO T (?, ?)', logIndex: 0 },
        { type: 'sql', id: '4d-ac', paramsString: '[STRING:1:v1][STRING:2:v2]', logIndex: 1 }
      ]
    }
  ];

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

  console.log("Executed IDs (normalized):", Array.from(executedIds));

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
  results.forEach(r => console.log("Log:", r.reconstructedSql.substring(0, 30), "Type:", r.type));
}

testMixedCaseIds();
