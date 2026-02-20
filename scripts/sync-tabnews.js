const sqlite3 = require('sqlite3').verbose();
const fetch = require('node-fetch');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '../data/posts.db');
const USERNAME = 'GabrielBaiano'; // Presumed username based on GitHub
const START_DATE = new Date('2026-02-15');

async function initDb() {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(DB_PATH, (err) => {
            if (err) reject(err);
            db.run(`CREATE TABLE IF NOT EXISTS posts (
                id TEXT PRIMARY KEY,
                title TEXT,
                slug TEXT,
                published_at TEXT,
                owner_username TEXT,
                url TEXT
            )`, (err) => {
                if (err) reject(err);
                resolve(db);
            });
        });
    });
}

async function fetchTabNewsPosts() {
    const response = await fetch(`https://www.tabnews.com.br/api/v1/contents/${USERNAME}`);
    if (!response.ok) throw new Error(`Failed to fetch posts: ${response.statusText}`);
    return await response.json();
}

async function sync() {
    console.log('Starting sync...');
    const db = await initDb();

    try {
        const posts = await fetchTabNewsPosts();
        console.log(`Fetched ${posts.length} posts from TabNews.`);

        const insertStmt = db.prepare(`
            INSERT OR IGNORE INTO posts (id, title, slug, published_at, owner_username, url)
            VALUES (?, ?, ?, ?, ?, ?)
        `);

        let newPostsCount = 0;
        for (const post of posts) {
            const publishedAt = new Date(post.published_at);
            if (publishedAt > START_DATE) {
                const url = `https://www.tabnews.com.br/${post.owner_username}/${post.slug}`;
                insertStmt.run(post.id, post.title, post.slug, post.published_at, post.owner_username, url);
                newPostsCount++;
            }
        }
        insertStmt.finalize();
        console.log(`Synced ${newPostsCount} posts after Feb 15, 2026.`);

        // Export to JSON for frontend use
        db.all("SELECT * FROM posts ORDER BY published_at DESC", (err, rows) => {
            if (err) throw err;
            fs.writeFileSync(path.join(__dirname, '../data/posts.json'), JSON.stringify(rows, null, 2));
            console.log('Posts exported to data/posts.json');
            db.close();
        });

    } catch (error) {
        console.error('Error during sync:', error);
        db.close();
    }
}

sync();
