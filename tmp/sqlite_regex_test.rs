use rusqlite::{Connection, Result};
use rusqlite::functions::FunctionFlags;

fn main() -> Result<()> {
    let conn = Connection::open_in_memory()?;
    
    conn.execute_batch(
        "CREATE TABLE files (name TEXT);
         INSERT INTO files (name) VALUES ('hello.txt'), ('world.png'), ('test.txt');"
    )?;

    let query = "^h.*\\.txt$";
    let re = regex::Regex::new(query).unwrap();

    conn.create_scalar_function(
        "regexp",
        2,
        FunctionFlags::SQLITE_UTF8 | FunctionFlags::SQLITE_DETERMINISTIC,
        move |ctx| {
            let text = ctx.get::<String>(1)?;
            Ok(re.is_match(&text))
        },
    )?;

    let mut stmt = conn.prepare("SELECT name FROM files WHERE name REGEXP ?1")?;
    let rows = stmt.query_map(rusqlite::params![""], |row| {
        row.get::<_, String>(0)
    })?;

    for row in rows {
        println!("Regex Match: {}", row?);
    }

    Ok(())
}
