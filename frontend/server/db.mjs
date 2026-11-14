// The shop's SQLite database (built into Node.js, no install needed).
// File: <DATA_DIR>/dev-computer.db — open it with "DB Browser for SQLite" or the owner portal's Database page.
import {DatabaseSync} from 'node:sqlite';
import {mkdirSync} from 'node:fs';
import {join,resolve} from 'node:path';

export const DB_FILE='dev-computer.db';

// Tables. Readable columns for viewing/querying, plus a `data` column (JSON) holding the full record
// so the app keeps every detail (delivery history, map points, photos …).
const SCHEMA=`
CREATE TABLE IF NOT EXISTS products(
 id INTEGER PRIMARY KEY, name TEXT NOT NULL, category TEXT, brand TEXT,
 price_paise INTEGER NOT NULL, stock INTEGER NOT NULL, active INTEGER NOT NULL DEFAULT 1, data TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS orders(
 id TEXT PRIMARY KEY, created_at TEXT, customer_email TEXT, customer_name TEXT, phone TEXT, address TEXT,
 status TEXT, payment_method TEXT, total_paise INTEGER, delivery_partner TEXT, data TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS order_items(
 order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE, product_id INTEGER, product_name TEXT,
 quantity INTEGER, price_paise INTEGER);
CREATE TABLE IF NOT EXISTS returns(
 id TEXT PRIMARY KEY, order_id TEXT, product_id INTEGER, customer_email TEXT, status TEXT, reason TEXT, data TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS reviews(
 id TEXT PRIMARY KEY, product_id INTEGER, customer_email TEXT, rating INTEGER, review_text TEXT, data TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS promotions(
 id TEXT PRIMARY KEY, kind TEXT, title TEXT, published INTEGER, start_date TEXT, end_date TEXT, data TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS repairs(
 id TEXT PRIMARY KEY, customer_email TEXT, item TEXT, status TEXT, price_paise INTEGER, data TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS categories(id TEXT PRIMARY KEY, name TEXT NOT NULL, icon TEXT);
CREATE TABLE IF NOT EXISTS saved_user_data(email TEXT PRIMARY KEY, data TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY, value TEXT);
CREATE TABLE IF NOT EXISTS customers(
 email TEXT PRIMARY KEY, name TEXT, phone TEXT, first_seen INTEGER, last_seen INTEGER, last_login INTEGER,
 logins INTEGER NOT NULL DEFAULT 0, orders INTEGER NOT NULL DEFAULT 0, spent_paise INTEGER NOT NULL DEFAULT 0,
 events INTEGER NOT NULL DEFAULT 0, device TEXT);
CREATE TABLE IF NOT EXISTS activity(
 id TEXT PRIMARY KEY, at INTEGER NOT NULL, type TEXT NOT NULL, email TEXT, name TEXT, phone TEXT,
 session TEXT, device TEXT, detail TEXT);
CREATE INDEX IF NOT EXISTS activity_at ON activity(at);
CREATE INDEX IF NOT EXISTS activity_email ON activity(email);
CREATE TABLE IF NOT EXISTS sessions(token_hash TEXT PRIMARY KEY, email TEXT NOT NULL, name TEXT, phone TEXT, expires INTEGER NOT NULL);

-- Easy-to-read views: rupees instead of paise, normal dates instead of millisecond numbers.
DROP VIEW IF EXISTS orders_readable;
CREATE VIEW orders_readable AS SELECT id AS order_id, datetime(created_at,'localtime') AS placed_at, customer_name, customer_email,
 status, payment_method, total_paise/100.0 AS total_rupees, delivery_partner, address FROM orders ORDER BY created_at DESC;
DROP VIEW IF EXISTS products_readable;
CREATE VIEW products_readable AS SELECT id, name, category, brand, price_paise/100.0 AS price_rupees, stock,
 CASE active WHEN 1 THEN 'yes' ELSE 'no' END AS on_sale FROM products ORDER BY category, name;
DROP VIEW IF EXISTS customers_readable;
CREATE VIEW customers_readable AS SELECT name, email, phone, logins, orders, spent_paise/100.0 AS spent_rupees,
 datetime(first_seen/1000,'unixepoch','localtime') AS first_seen, datetime(last_login/1000,'unixepoch','localtime') AS last_sign_in,
 datetime(last_seen/1000,'unixepoch','localtime') AS last_active FROM customers ORDER BY last_seen DESC;
DROP VIEW IF EXISTS activity_readable;
CREATE VIEW activity_readable AS SELECT datetime(at/1000,'unixepoch','localtime') AS time, type, COALESCE(name,email,'guest') AS who,
 email, detail FROM activity ORDER BY at DESC;
`;

const open=new Map();

/** Opens (once per folder) the shop database and creates any missing tables. */
export function openDb(dir){
 const key=resolve(dir);
 if(open.has(key))return open.get(key);
 mkdirSync(key,{recursive:true});
 const db=new DatabaseSync(join(key,DB_FILE));
 db.exec('PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=3000;');
 db.exec(SCHEMA);
 open.set(key,db);
 return db;
}

/** A second, read-only connection: used by the owner's SQL box so a query can never change data. */
export function openReadOnly(dir){return new DatabaseSync(join(resolve(dir),DB_FILE),{readOnly:true});}

export function transaction(db,fn){db.exec('BEGIN');try{const r=fn();db.exec('COMMIT');return r;}catch(e){db.exec('ROLLBACK');throw e;}}

export function closeDb(dir){const key=resolve(dir),db=open.get(key);if(db){db.close();open.delete(key);}}
export function closeAll(){for(const db of open.values())try{db.close();}catch{}open.clear();}
// Close cleanly before other exit handlers (e.g. tests deleting temp folders on Windows).
process.prependListener('exit',closeAll);
