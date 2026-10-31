# ElectroShop backend + portals

This update adds a working FastAPI backend, a persistent SQLite database, and responsive browser portals. Your original Expo frontend is preserved; its existing screens still use local demo state and are not yet connected to these APIs. Use the browser portals below for the complete working flow.

## Start on Windows PowerShell

From your project folder:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
python -c "import secrets; print(secrets.token_hex(32))"
```

Open `.env` and replace APP_SECRET with the generated value. Set ADMIN_EMAILS to your own email address (comma-separated for multiple owners). Never put real credentials in `.env.example` or commit `.env`.

```powershell
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

- Customer shop: http://localhost:8000/
- Owner portal: http://localhost:8000/admin
- API documentation: http://localhost:8000/docs

For testing on your phone, use your computer's LAN IP, for example `http://192.168.1.5:8000`, with both devices on the same Wi-Fi. Permit Python through your local firewall if prompted.

## First login and products

1. Open the owner portal and enter the email configured in ADMIN_EMAILS.
2. With `OTP_MODE=console`, the code is printed in your backend terminal. This is local development only; no email is sent.
3. Enter that six-digit code. You can add, edit, or remove products and change their prices and stock.
4. Product images use publicly accessible HTTPS image URLs. File uploads are not included.
5. Open the customer shop. Add products to your cart, log in, and place a cash-on-delivery order.
6. Owners can confirm orders, mark them shipped, then delivered. Placed/confirmed orders may be cancelled; cancellation restores stock exactly once.

Customer accounts cannot call admin APIs. Only the server's ADMIN_EMAILS configuration grants owner access. Never expose this configuration through an unauthenticated settings screen.

## Real email OTP

Set `OTP_MODE=smtp` and fill in SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, and SMTP_FROM in `.env`. The server uses STARTTLS on port 587. Use your email provider's app password or SMTP credential, rather than your normal account password. Real delivery requires valid provider credentials and has not been verified in this environment.

OTP codes expire in five minutes, are stored as keyed hashes, allow five attempts, and have resend/hourly limits. Sessions expire after 24 hours. Browser sessions use HttpOnly cookies. Admins also log in by OTP; role checks run on every protected request.

## Database control and backup

The database is created automatically at DATABASE_PATH (default `backend/shop.db` when launched from backend with the example settings). It stores users, session hashes, OTP hashes, products, orders, and item snapshots. You can inspect the file with a SQLite database viewer. Shut down the server before making a file backup. Keep backups private: orders contain customer contact information.

Prices are integer paise. The server calculates order totals and delivery fees (₹49 below ₹1,000; free at ₹1,000+), checks availability, and deducts inventory in a single transaction. The client cannot choose a price or assign itself an admin role.

## Deployment

Use one backend instance with a persistent disk for SQLite. Do not store this database on an ephemeral deployment filesystem. For a larger or multi-instance shop, migrate to PostgreSQL and introduce managed database migrations before scaling.

Before live deployment:

- Set a random APP_SECRET, `OTP_MODE=smtp`, `COOKIE_SECURE=true`, and serve the portals over HTTPS.
- Set ADMIN_EMAILS to shop-owner addresses and CORS_ORIGINS to your exact frontend origin if needed.
- Back up the database, configure SMTP, and test email delivery and recovery.
- For internet-facing use, add edge rate limiting, monitoring, and operational backups.

Cash on delivery is implemented. Online payment, GST invoices, password login, SMS OTP, refunds, and media uploads are not implemented. Never mark an online payment as paid without verifying a payment provider webhook.

## API integration with Expo

All API endpoints begin with `/api`. Send `X-Shop-Client: electroshop` on POST, PUT, and DELETE requests. Fetch `/api/products`, request an email code with `/api/auth/request-otp`, and verify it with `/api/auth/verify-otp`. The current portals use same-origin session cookies. Native Expo session storage and API integration require a separate implementation; this update does not pretend the original demo screens already use the server.

## Verification

```powershell
pip install pytest httpx
python -m pytest tests -q
```

Tests cover OTP expiry/reuse/attempt limits, role enforcement, logout, input validation, order ownership, server-calculated totals, inventory rollback, cancellation, and static portal routes.
