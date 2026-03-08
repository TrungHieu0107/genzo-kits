import * as fs from 'fs';
import { parseSqlLogs } from './src/tools/sql-log-parser/parser';

const log = fs.readFileSync('docs/stcApp.log', 'utf-8');
const sessions = parseSqlLogs(log);

console.log(`Found ${sessions.length} sessions.`);
if (sessions.length > 0) {
    const first = sessions[0];
    console.log(`First session DAO: ${first.daoName} (Thread: ${first.threadName})`);
    const sqlLogs = first.logs.filter(l => l.type === 'sql');
    console.log(`SQL queries in first session: ${sqlLogs.length}`);
    const reconstructed = sqlLogs.filter(l => l.reconstructedSql);
    console.log(`Reconstructed SQL queries in first session: ${reconstructed.length}`);
    if (reconstructed.length > 0) {
        console.log(`Sample Reconstructed SQL:\n${reconstructed[0].reconstructedSql}`);
    } else {
        console.log(`No reconstructed SQL found in first session.`);
    }

    // Checking specifically if there's any SQL with parameters working across all sessions
    for (const session of sessions) {
        const withSql = session.logs.filter(l => l.reconstructedSql && l.reconstructedSql.includes('SELECT'));
        if (withSql.length > 0) {
            console.log(`\nFound good session: ${session.daoName}`);
            console.log(`Sample Reconstructed SQL:\n${withSql[0].reconstructedSql}`);
            break;
        }
    }
}
