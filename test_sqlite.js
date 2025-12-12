const Database = require('better-sqlite3');
try {
    const db = new Database('dev.db');
    db.prepare('CREATE TABLE IF NOT EXISTS test (id INTEGER PRIMARY KEY, name TEXT)').run();
    db.prepare('INSERT INTO test (name) VALUES (?)').run('Test User');
    const row = db.prepare('SELECT * FROM test ORDER BY id DESC LIMIT 1').get();
    console.log('Success:', row);
} catch (e) {
    console.error('Error:', e);
}
