"""ElectroShop API and browser portals. Run: uvicorn main:app --reload."""
import hashlib
import hmac
import os
import secrets
import smtplib
import sqlite3
import time
from contextlib import contextmanager
from email.message import EmailMessage
from pathlib import Path
from typing import Literal

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

BASE = Path(__file__).resolve().parent
load_dotenv(BASE / '.env')
DB = os.getenv('DATABASE_PATH', str(BASE / 'shop.db'))
SECRET = os.getenv('APP_SECRET', '')
if len(SECRET) < 32:
    raise RuntimeError('Set APP_SECRET to a random value of at least 32 characters in backend/.env')
DEV = os.getenv('OTP_MODE', 'smtp') == 'console'
ADMIN = {x.strip().lower() for x in os.getenv('ADMIN_EMAILS', '').split(',') if x.strip()}
COOKIE_SECURE = os.getenv('COOKIE_SECURE', 'true').lower() == 'true'

@contextmanager
def db():
    c = sqlite3.connect(DB, timeout=15)
    c.row_factory = sqlite3.Row
    c.execute('PRAGMA foreign_keys=ON')
    try:
        yield c
        c.commit()
    except Exception:
        c.rollback()
        raise
    finally:
        c.close()

with db() as c:
    c.executescript('''
    CREATE TABLE IF NOT EXISTS users(email TEXT PRIMARY KEY, created INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS otps(email TEXT PRIMARY KEY, digest TEXT NOT NULL, expires INTEGER NOT NULL, attempts INTEGER NOT NULL DEFAULT 0, sent INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS limits(key TEXT PRIMARY KEY, count INTEGER NOT NULL, expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS sessions(digest TEXT PRIMARY KEY, email TEXT REFERENCES users(email), expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS products(id INTEGER PRIMARY KEY, name TEXT NOT NULL, category TEXT NOT NULL, description TEXT NOT NULL, price_paise INTEGER NOT NULL CHECK(price_paise>0), stock INTEGER NOT NULL CHECK(stock>=0), image_url TEXT NOT NULL DEFAULT '', active INTEGER NOT NULL DEFAULT 1);
    CREATE TABLE IF NOT EXISTS orders(id TEXT PRIMARY KEY, email TEXT REFERENCES users(email), name TEXT NOT NULL, phone TEXT NOT NULL, address TEXT NOT NULL, status TEXT NOT NULL, total_paise INTEGER NOT NULL, created INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS order_items(id INTEGER PRIMARY KEY, order_id TEXT REFERENCES orders(id), product_id INTEGER REFERENCES products(id), name TEXT NOT NULL, price_paise INTEGER NOT NULL, quantity INTEGER NOT NULL);
    ''')

app = FastAPI(title='ElectroShop', version='1.0.0')
app.add_middleware(CORSMiddleware, allow_origins=[x.strip() for x in os.getenv('CORS_ORIGINS', 'http://localhost:8081').split(',')], allow_credentials=True, allow_methods=['GET','POST','PUT','DELETE'], allow_headers=['Content-Type','Authorization','X-Shop-Client'])

@app.middleware('http')
async def security(request: Request, call_next):
    if request.method in {'POST','PUT','DELETE','PATCH'} and request.headers.get('X-Shop-Client') != 'electroshop':
        return Response('Missing X-Shop-Client header', status_code=403)
    response = await call_next(request)
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['Referrer-Policy'] = 'same-origin'
    response.headers['Cache-Control'] = 'no-store'
    response.headers['Content-Security-Policy'] = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' https:; frame-ancestors 'none'; base-uri 'self'"
    return response

def digest(value):
    return hmac.new(SECRET.encode(), value.encode(), hashlib.sha256).hexdigest()

def email_address(value):
    import re
    value = value.strip().lower()
    if len(value) > 254 or not re.fullmatch(r'[^\s@]+@[^\s@]+\.[^\s@]+', value):
        raise HTTPException(422, 'Enter a valid email address')
    return value

def rate_limit(key, maximum, seconds):
    now = int(time.time())
    with db() as c:
        c.execute('BEGIN IMMEDIATE')
        c.execute('DELETE FROM limits WHERE expires<=?', (now,))
        row = c.execute('SELECT * FROM limits WHERE key=?', (key,)).fetchone()
        if row and row['count'] >= maximum:
            raise HTTPException(429, 'Too many requests. Try again later.')
        c.execute('INSERT INTO limits VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1', (key, now+seconds))

def current_user(request: Request):
    token = request.cookies.get('shop_session', '')
    auth = request.headers.get('Authorization', '')
    if auth.startswith('Bearer '):
        token = auth[7:]
    with db() as c:
        row = c.execute('SELECT email FROM sessions WHERE digest=? AND expires>?', (digest(token), int(time.time()))).fetchone()
    if not row:
        raise HTTPException(401, 'Please log in')
    return {'email': row['email'], 'role': 'admin' if row['email'] in ADMIN else 'customer'}

def admin(user=Depends(current_user)):
    if user['role'] != 'admin':
        raise HTTPException(403, 'Admin access required')
    return user

class EmailInput(BaseModel):
    email: str = Field(max_length=254)
class VerifyInput(EmailInput):
    code: str = Field(pattern=r'^\d{6}$')

@app.post('/api/auth/request-otp')
def request_otp(body: EmailInput, request: Request):
    email = email_address(body.email)
    rate_limit('ip:'+request.client.host, 20, 3600)
    rate_limit('email:'+email, 5, 3600)
    now = int(time.time())
    code = f'{secrets.randbelow(1000000):06d}'
    with db() as c:
        c.execute('BEGIN IMMEDIATE')
        previous = c.execute('SELECT sent FROM otps WHERE email=?', (email,)).fetchone()
        if previous and now-previous['sent'] < 60:
            raise HTTPException(429, 'Wait 60 seconds before requesting another code')
        c.execute('INSERT OR REPLACE INTO otps VALUES(?,?,?,0,?)', (email, digest(email+':'+code), now+300, now))
    if DEV:
        print(f'LOCAL DEVELOPMENT OTP for {email}: {code}', flush=True)
    else:
        try:
            message = EmailMessage()
            message['From'] = os.environ['SMTP_FROM']
            message['To'] = email
            message['Subject'] = 'Your ElectroShop login code'
            message.set_content(f'Your login code is {code}. It expires in 5 minutes. Do not share this code.')
            with smtplib.SMTP(os.environ['SMTP_HOST'], int(os.getenv('SMTP_PORT', '587')), timeout=15) as smtp:
                smtp.starttls()
                smtp.login(os.environ['SMTP_USER'], os.environ['SMTP_PASSWORD'])
                smtp.send_message(message)
        except Exception:
            with db() as c:
                c.execute('DELETE FROM otps WHERE email=?', (email,))
            raise HTTPException(503, 'Email delivery unavailable. Ask the shop owner to check SMTP settings.')
    return {'message': 'Code generated. Check the backend terminal.' if DEV else 'Check your email for your code.', 'development': DEV}

@app.post('/api/auth/verify-otp')
def verify_otp(body: VerifyInput, response: Response):
    email = email_address(body.email)
    now = int(time.time())
    valid = False
    with db() as c:
        c.execute('BEGIN IMMEDIATE')
        row = c.execute('SELECT * FROM otps WHERE email=?', (email,)).fetchone()
        if row and row['expires'] > now and row['attempts'] < 5:
            c.execute('UPDATE otps SET attempts=attempts+1 WHERE email=?', (email,))
            valid = hmac.compare_digest(row['digest'], digest(email+':'+body.code))
            if valid:
                c.execute('DELETE FROM otps WHERE email=?', (email,))
                c.execute('INSERT OR IGNORE INTO users VALUES(?,?)', (email, now))
                token = secrets.token_urlsafe(48)
                c.execute('DELETE FROM sessions WHERE expires<=?', (now,))
                c.execute('INSERT INTO sessions VALUES(?,?,?)', (digest(token), email, now+86400))
    if not valid:
        raise HTTPException(400, 'Invalid or expired code. Request a new code after five attempts.')
    response.set_cookie('shop_session', token, max_age=86400, httponly=True, secure=COOKIE_SECURE, samesite='lax')
    return {'email': email, 'role': 'admin' if email in ADMIN else 'customer'}

@app.get('/api/auth/me')
def me(user=Depends(current_user)):
    return user

@app.post('/api/auth/logout')
def logout(request: Request, response: Response):
    with db() as c:
        c.execute('DELETE FROM sessions WHERE digest=?', (digest(request.cookies.get('shop_session', '')),))
    response.delete_cookie('shop_session', secure=COOKIE_SECURE, httponly=True, samesite='lax')
    return {'message': 'Logged out'}

class Product(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    category: Literal['Laptop','Headphone','Microphone','Camera','Other']
    description: str = Field(default='', max_length=4000)
    price_paise: int = Field(gt=0, le=100000000, strict=True)
    stock: int = Field(ge=0, le=100000, strict=True)
    image_url: str = Field(default='', max_length=2000, pattern=r'^(https://[^\s]+)?$')

@app.get('/api/products')
def products(q: str = '', category: str = ''):
    with db() as c:
        return [dict(r) for r in c.execute('SELECT * FROM products WHERE active=1 AND name LIKE ? AND (?=\'\' OR category=?) ORDER BY id DESC LIMIT 500', ('%'+q[:150]+'%',category,category))]

@app.post('/api/admin/products', status_code=201)
def create_product(body: Product, user=Depends(admin)):
    with db() as c:
        result = c.execute('INSERT INTO products(name,category,description,price_paise,stock,image_url) VALUES(?,?,?,?,?,?)', tuple(body.model_dump().values()))
        return dict(c.execute('SELECT * FROM products WHERE id=?', (result.lastrowid,)).fetchone())

@app.put('/api/admin/products/{product_id}')
def update_product(product_id: int, body: Product, user=Depends(admin)):
    with db() as c:
        result = c.execute('UPDATE products SET name=?,category=?,description=?,price_paise=?,stock=?,image_url=? WHERE id=? AND active=1', (*body.model_dump().values(),product_id))
        if not result.rowcount:
            raise HTTPException(404, 'Product not found')
    return {'message':'Product updated'}

@app.delete('/api/admin/products/{product_id}')
def delete_product(product_id: int, user=Depends(admin)):
    with db() as c:
        c.execute('UPDATE products SET active=0 WHERE id=?', (product_id,))
    return {'message':'Product removed from shop'}

class Item(BaseModel):
    product_id: int
    quantity: int = Field(ge=1, le=100, strict=True)
class Checkout(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    phone: str = Field(pattern=r'^[6-9]\d{9}$')
    address: str = Field(min_length=10, max_length=1000)
    items: list[Item] = Field(min_length=1, max_length=100)

@app.post('/api/orders', status_code=201)
def checkout(body: Checkout, user=Depends(current_user)):
    quantities = {}
    for item in body.items:
        quantities[item.product_id] = quantities.get(item.product_id,0)+item.quantity
    order_id = 'ES-'+secrets.token_hex(8).upper()
    with db() as c:
        c.execute('BEGIN IMMEDIATE')
        rows = []
        total = 0
        for pid, qty in quantities.items():
            p = c.execute('SELECT * FROM products WHERE id=? AND active=1', (pid,)).fetchone()
            if not p or p['stock'] < qty:
                raise HTTPException(409, 'A product is unavailable or has insufficient stock. Refresh your cart.')
            total += p['price_paise']*qty
            rows.append((pid,p,qty))
        delivery = 0 if total >= 100000 else 4900
        c.execute('INSERT INTO orders VALUES(?,?,?,?,?,?,?,?)', (order_id,user['email'],body.name,body.phone,body.address,'Placed',total+delivery,int(time.time())))
        for pid,p,qty in rows:
            c.execute('UPDATE products SET stock=stock-? WHERE id=?', (qty,pid))
            c.execute('INSERT INTO order_items(order_id,product_id,name,price_paise,quantity) VALUES(?,?,?,?,?)', (order_id,pid,p['name'],p['price_paise'],qty))
    return {'id':order_id,'total_paise':total+delivery,'status':'Placed','payment':'Cash on delivery'}

def order_list(email=None):
    with db() as c:
        rows = c.execute('SELECT * FROM orders '+('WHERE email=? ' if email else '')+'ORDER BY created DESC', (email,) if email else ()).fetchall()
        return [dict(r, items=[dict(i) for i in c.execute('SELECT name,price_paise,quantity FROM order_items WHERE order_id=?', (r['id'],))]) for r in rows]

@app.get('/api/orders')
def my_orders(user=Depends(current_user)):
    return order_list(user['email'])

@app.get('/api/admin/orders')
def all_orders(user=Depends(admin)):
    return order_list()

class Status(BaseModel):
    status: Literal['Confirmed','Shipped','Delivered','Cancelled']

@app.put('/api/admin/orders/{order_id}')
def change_status(order_id: str, body: Status, user=Depends(admin)):
    transitions = {'Placed':{'Confirmed','Cancelled'},'Confirmed':{'Shipped','Cancelled'},'Shipped':{'Delivered'},'Delivered':set(),'Cancelled':set()}
    with db() as c:
        c.execute('BEGIN IMMEDIATE')
        order = c.execute('SELECT * FROM orders WHERE id=?',(order_id,)).fetchone()
        if not order:
            raise HTTPException(404, 'Order not found')
        if body.status not in transitions[order['status']]:
            raise HTTPException(409, 'Invalid status transition')
        if body.status == 'Cancelled':
            for item in c.execute('SELECT * FROM order_items WHERE order_id=?',(order_id,)).fetchall():
                c.execute('UPDATE products SET stock=stock+? WHERE id=?',(item['quantity'],item['product_id']))
        c.execute('UPDATE orders SET status=? WHERE id=?',(body.status,order_id))
    return {'message':'Order updated'}

@app.get('/health')
def health():
    return {'status':'ok'}

@app.get('/')
@app.get('/admin')
def portal():
    return FileResponse(BASE/'static'/'index.html')

@app.get('/app.js')
def javascript():
    return FileResponse(BASE/'static'/'app.js', media_type='application/javascript')
