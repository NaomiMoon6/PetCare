const { app } = require("electron");
const path = require("path");
const sqlite3 = require("sqlite3");

const dbPath = path.join(app.getPath("userData"), "pets.db");

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error("Database error:", err);
    } else {
        console.log("Database opened:", dbPath);
    }
});

db.serialize(() => {

    db.run(`
        CREATE TABLE IF NOT EXISTS pets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            type TEXT NOT NULL,
            birth_date TEXT,
            sex TEXT,
            photo TEXT
        );
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS vaccines (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            pet_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            date TEXT,
            doctor TEXT,
            next_dose TEXT,
            FOREIGN KEY (pet_id) REFERENCES pets(id)
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS reminders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            pet_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            datetime TEXT NOT NULL,
            last_reminder TEXT NOT NULL,

            repeat_interval INTEGER DEFAULT 0,
            repeat_unit TEXT DEFAULT NULL,

            FOREIGN KEY (pet_id) REFERENCES pets(id)
        );
    `);

});

module.exports = db;