import importlib
import os
import sys
import pytest
from fastapi.testclient import TestClient

@pytest.fixture
def shop(tmp_path, monkeypatch):
    monkeypatch.setenv('DATABASE_PATH', str(tmp_path/'test.db'))
    monkeypatch.setenv('APP_SECRET', 'test-secret-'*8)
    monkeypatch.setenv('ADMIN_EMAILS', 'owner@example.com')
    monkeypatch.setenv('OTP_MODE', 'console')
    monkeypatch.setenv('COOKIE_SECURE', 'false')
    sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
    sys.modules.pop('main', None)
    m=importlib.import_module('main')
    return m

def client(m):
    return TestClient(m.app, headers={'X-Shop-Client':'electroshop'})

def login(m, c, email, capsys):
    assert c.post('/api/auth/request-otp',json={'email':email}).status_code==200
    code=capsys.readouterr().out.strip().split()[-1]
    assert c.post('/api/auth/verify-otp',json={'email':email,'code':code}).status_code==200
    return code

PRODUCT={'name':'Camera','category':'Camera','description':'Test camera','price_paise':50000,'stock':2,'image_url':''}

def test_access_and_csrf(shop,capsys):
    c=client(shop)
    assert c.post('/api/admin/products',json=PRODUCT).status_code==401
    assert TestClient(shop.app).post('/api/auth/request-otp',json={'email':'a@b.com'}).status_code==403
    login(shop,c,'buyer@example.com',capsys)
    assert c.get('/api/auth/me').json()['role']=='customer'
    assert c.post('/api/admin/products',json=PRODUCT).status_code==403
    assert c.get('/api/admin/orders').status_code==403
    assert c.post('/api/auth/logout').status_code==200
    assert c.get('/api/auth/me').status_code==401

def test_otp_reuse_expiry_attempts_and_cooldown(shop,capsys):
    c=client(shop)
    code=login(shop,c,'one@example.com',capsys)
    assert c.post('/api/auth/verify-otp',json={'email':'one@example.com','code':code}).status_code==400
    c.post('/api/auth/request-otp',json={'email':'two@example.com'})
    correct=capsys.readouterr().out.strip().split()[-1]
    assert c.post('/api/auth/request-otp',json={'email':'two@example.com'}).status_code==429
    wrong='000001' if correct!='000001' else '000002'
    for _ in range(5):
        assert c.post('/api/auth/verify-otp',json={'email':'two@example.com','code':wrong}).status_code==400
    assert c.post('/api/auth/verify-otp',json={'email':'two@example.com','code':correct}).status_code==400
    c.post('/api/auth/request-otp',json={'email':'three@example.com'})
    code=capsys.readouterr().out.strip().split()[-1]
    with shop.db() as d:
        d.execute('UPDATE otps SET expires=0 WHERE email=?',('three@example.com',))
    assert c.post('/api/auth/verify-otp',json={'email':'three@example.com','code':code}).status_code==400

def test_order_inventory_and_ownership(shop,capsys):
    owner,buyer,other=client(shop),client(shop),client(shop)
    login(shop,owner,'owner@example.com',capsys)
    login(shop,buyer,'buyer@example.com',capsys)
    login(shop,other,'other@example.com',capsys)
    pid=owner.post('/api/admin/products',json=PRODUCT).json()['id']
    body={'name':'Test User','phone':'9876543210','address':'Jaipur Rajasthan 302001','items':[{'product_id':pid,'quantity':1},{'product_id':pid,'quantity':1}]}
    r=buyer.post('/api/orders',json={**body,'total_paise':1})
    assert r.status_code==201
    assert r.json()['total_paise']==100000
    oid=r.json()['id']
    assert buyer.get('/api/products').json()[0]['stock']==0
    assert buyer.post('/api/orders',json=body).status_code==409
    assert other.get('/api/orders').json()==[]
    assert len(buyer.get('/api/orders').json())==1
    assert buyer.put('/api/admin/orders/'+oid,json={'status':'Cancelled'}).status_code==403
    assert owner.put('/api/admin/orders/'+oid,json={'status':'Delivered'}).status_code==409
    assert owner.put('/api/admin/orders/'+oid,json={'status':'Cancelled'}).status_code==200
    assert owner.put('/api/admin/orders/'+oid,json={'status':'Cancelled'}).status_code==409
    assert buyer.get('/api/products').json()[0]['stock']==2
    assert owner.delete('/api/admin/products/'+str(pid)).status_code==200
    assert buyer.get('/api/products').json()==[]
    assert buyer.post('/api/orders',json=body).status_code==409

def test_atomic_rollback_and_validation(shop,capsys):
    c=client(shop)
    login(shop,c,'owner@example.com',capsys)
    assert c.post('/api/admin/products',json={**PRODUCT,'stock':-1}).status_code==422
    assert c.post('/api/admin/products',json={**PRODUCT,'image_url':'javascript:alert(1)'}).status_code==422
    pid=c.post('/api/admin/products',json=PRODUCT).json()['id']
    body={'name':'Test User','phone':'9876543210','address':'Jaipur Rajasthan 302001','items':[{'product_id':pid,'quantity':1},{'product_id':9999,'quantity':1}]}
    assert c.post('/api/orders',json=body).status_code==409
    assert c.get('/api/products').json()[0]['stock']==2
    assert c.get('/api/orders').json()==[]
    assert c.get('/').status_code==200
    assert c.get('/admin').status_code==200
    assert c.get('/app.js').status_code==200

def test_competing_orders_do_not_oversell(shop,capsys):
    from concurrent.futures import ThreadPoolExecutor
    c=client(shop)
    login(shop,c,'owner@example.com',capsys)
    pid=c.post('/api/admin/products',json={**PRODUCT,'stock':1}).json()['id']
    cookie=c.cookies.get('shop_session')
    body={'name':'Test User','phone':'9876543210','address':'Jaipur Rajasthan 302001','items':[{'product_id':pid,'quantity':1}]}
    def order(_):
        customer=client(shop)
        customer.cookies.set('shop_session',cookie)
        return customer.post('/api/orders',json=body).status_code
    with ThreadPoolExecutor(max_workers=2) as pool:
        assert sorted(pool.map(order, range(2)))==[201,409]
    assert c.get('/api/products').json()[0]['stock']==0
    assert len(c.get('/api/orders').json())==1
