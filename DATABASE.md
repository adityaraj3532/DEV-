# Your shop database — a beginner's guide

## What is a database?

A database is an organised place where an app keeps its information. Think of it as a set of **spreadsheets**:

- each **table** is one spreadsheet (for example `orders` or `customers`),
- each **row** is one record (one order, one customer),
- each **column** is one piece of information (name, status, price…).

Dev Computer uses **SQLite**. It is a real SQL database that lives in **one file**, is built into Node.js,
and needs no installation, account or internet. Android phones, browsers and many apps use SQLite inside.

**Your database file:** `frontend/data/dev-computer.db`
(It is never uploaded to GitHub, because it contains customer information.)

The server creates it automatically the first time you run `npm start`. Your older data
(`shop.json`, `customers.json`, `activity.jsonl`, `sessions.json`) was imported into it, and the old files were
kept with `.imported` added to their names.

## What is stored where

| Table | What it holds |
|---|---|
| `orders` | Every order: customer, phone, address, status, payment, total, delivery partner |
| `order_items` | One row per product inside each order (`order_id` links to `orders.id`) |
| `products` | Your catalogue: name, category, brand, price, stock, on sale or not |
| `customers` | Everyone who signed in: sign-ins, orders, money spent, last seen |
| `activity` | Everything people did: sign-ins, pages viewed, add to cart, orders, repairs |
| `returns`, `reviews`, `repairs` | Return requests, product reviews, repair bookings |
| `promotions`, `categories` | Your offers/events and custom categories |
| `saved_user_data` | Each signed-in person's cart, wishlist, saved addresses and profile |
| `settings` | Small app settings |
| `sessions` | Who is signed in (only a scrambled "hash" of each sign-in token; hidden from the Database page) |

Money is stored in **paise** (₹1 = 100 paise) so there are no rounding errors. Times in `customers` and
`activity` are milliseconds since 1970 — that's why there are **readable views**:

| View (a saved question) | Shows |
|---|---|
| `orders_readable` | Orders with rupees and normal dates — **start here** |
| `customers_readable` | Customers with rupees and dates |
| `activity_readable` | The activity log with normal times |
| `products_readable` | Products with rupees |

Many tables also have a `data` column: the full record as JSON text, so the app keeps every detail
(delivery history, map points, photos). You can ignore it while learning.

## Way 1 — the Database page in your app (easiest)

1. Start the server: `npm start`
2. Open http://localhost:8080/?portal=admin and sign in with your owner email.
3. Click **Database** in the owner menu.
4. Click any table or view to see its rows (50 at a time, newest first).
5. Scroll to **Ask your own question (SQL)**, click an example such as *Sales per day*, and press **Run query**.

This page is **read-only**: it uses a separate read-only connection and only accepts `SELECT` questions,
so nothing you type there can change or delete your data. Experiment freely.

## Way 2 — DB Browser for SQLite (a free desktop app)

1. Download it from **https://sqlitebrowser.org** (Windows installer) and install it.
2. Open it → **Open Database Read Only…** → choose `D:\DEV - Copy\DEV-\frontend\data\dev-computer.db`.
3. **Browse Data** tab: pick a table from the drop-down to see it like a spreadsheet.
4. **Execute SQL** tab: type a query and press ▶ (or Ctrl+Enter).

Use **Read Only** while the shop server is running. Editing data by hand while the app runs can confuse the app,
so change products, orders and offers through the owner portal instead.

(VS Code users: the extension **"SQLite Viewer"** opens `.db` files with a double-click.)

## Learn SQL in 5 minutes

SQL reads almost like English. Try these in the Database page:

```sql
-- 1. Show everything in a table (SELECT * means "all columns")
SELECT * FROM products_readable;

-- 2. Pick columns and filter rows with WHERE
SELECT name, stock FROM products_readable WHERE stock < 5;

-- 3. Sort with ORDER BY (DESC = biggest first), limit with LIMIT
SELECT customer_name, total_rupees FROM orders_readable ORDER BY total_rupees DESC LIMIT 5;

-- 4. Count and add up with COUNT / SUM, grouped by something
SELECT status, COUNT(*) AS how_many, SUM(total_rupees) AS rupees
FROM orders_readable GROUP BY status;

-- 5. Join two tables: which products did each order contain?
SELECT o.id, o.customer_name, i.product_name, i.quantity
FROM orders o JOIN order_items i ON i.order_id = o.id;

-- 6. Read a value inside JSON text
SELECT json_extract(detail, '$.page') AS page, COUNT(*) AS views
FROM activity WHERE type = 'view' GROUP BY page ORDER BY views DESC;
```

Key words: `SELECT` (which columns) · `FROM` (which table) · `WHERE` (which rows) · `ORDER BY` (sorting) ·
`GROUP BY` + `COUNT`/`SUM`/`AVG` (totals) · `JOIN … ON` (combine tables) · `LIMIT` (how many).

## Backups

Make a copy of the database at any time, even while the server runs:

```bash
npm run db:backup
```

Copies are saved in `frontend/data/backups/` with the date and time in the name. To restore one: stop the
server, copy the backup over `frontend/data/dev-computer.db` (delete the `-wal` and `-shm` files next to it),
then start the server again.

## Hosting

On a server, keep `DATA_DIR` on persistent storage (the Render blueprint mounts a disk at `/data`) so the
database file survives restarts, and run `npm run db:backup` regularly or download the file.

## Where it is in the code

- `frontend/server/db.mjs`: opens the database and creates the tables and readable views.
- `frontend/server/shop.mjs`: saves the products, orders, returns, reviews, offers, repairs and categories.
- `frontend/server/store.mjs`: saves customers and the activity log.
- `frontend/server/auth.mjs`: saves sign-in sessions.
- `frontend/server/db-explorer.mjs` and `frontend/src/db-panel.js`: the Database page.
- `frontend/server/backup.mjs`: the backup command.
