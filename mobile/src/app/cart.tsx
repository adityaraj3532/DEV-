import React, { useRef, useState } from 'react';
import { Text } from 'react-native';
import { router } from 'expo-router';
import { Button, Card, Field, Muted, Row, Shell, styles, Title } from '../components/ui';
import { useShop } from '../lib/store';
import { money, checkoutKey } from '../lib/supabase';
export default function Cart() {
  const attempt = useRef<{
    body: string;
    key: string;
  } | null>(null);
  const s = useShop(),
    [name, setName] = useState(s.customer.profile?.name || ''),
    [phone, setPhone] = useState(s.customer.profile?.phone || ''),
    [address, setAddress] = useState(''),
    [note, setNote] = useState(''),
    [busy, setBusy] = useState(false);
  const items = Object.entries(s.cart).filter(([, q]) => q > 0),
    subtotal = items.reduce((n, [id, q]) => n + (s.products.find(p => p.id === Number(id))?.price_paise || 0) * q, 0),
    delivery = subtotal && subtotal < 100000 ? 4900 : 0;
  async function submit() {
    if (!s.user) {
      router.push('/login');
      return;
    }
    setBusy(true);
    try {
      const body = {
        name,
        phone,
        address,
        payment_method: 'COD',
        items: items.map(([id, quantity]) => ({
          product_id: Number(id),
          quantity
        }))
      };
      const signature = JSON.stringify(body);
      if (attempt.current?.body !== signature) attempt.current = {
        body: signature,
        key: checkoutKey()
      };
      const order = await s.mutate('/orders', 'POST', {
        ...body,
        checkout_key: attempt.current.key
      });
      attempt.current = null;
      await s.saveCustomer({
        cart: {}
      });
      setNote('Order ' + order.id + ' submitted. Waiting for owner confirmation.');
    } catch (e) {
      setNote((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return <Shell><Title>Your cart</Title>{items.map(([id, q]) => {
      const p = s.products.find(p => p.id === Number(id));
      return <Card key={id}><Title>{p?.name || 'Unavailable product'}</Title><Text>{p ? money(p.price_paise * q) : 'Remove this unavailable item'}</Text><Row><Button title="−" secondary onPress={() => s.setQuantity(Number(id), q - 1).catch(e => setNote(e.message))} /><Text>{q}</Text><Button title="+" secondary onPress={() => s.setQuantity(Number(id), q + 1).catch(e => setNote(e.message))} /><Button title="Remove" secondary onPress={() => s.setQuantity(Number(id), 0).catch(e => setNote(e.message))} /></Row><Muted>{p?.returnable ? `Returnable for ${p.return_days} days after delivery` : 'Not returnable'}</Muted></Card>;
    })}{!items.length ? <Card><Muted>Your cart is empty.</Muted><Button title="Browse products" onPress={() => router.push('/')} /></Card> : <Card><Title>Checkout</Title><Muted>Subtotal {money(subtotal)} · Delivery {money(delivery)}</Muted><Text style={styles.price}>Total {money(subtotal + delivery)}</Text><Muted>The server checks prices and stock at submission. Packing and shipping begin only after the owner confirms.</Muted><Field label="Full name" value={name} onChangeText={setName} /><Field label="Indian mobile number" keyboardType="phone-pad" value={phone} onChangeText={setPhone} /><Field label="Delivery address, city, state and PIN" value={address} onChangeText={setAddress} multiline />{s.customer.addresses?.map(a => <Button key={a.id} title={'Use ' + a.label} secondary onPress={() => {
        setName(a.name);
        setPhone(a.phone);
        setAddress(`${a.line}, ${a.city}, ${a.state} ${a.pin}`);
      }} />)}<Muted>Cash on delivery. Online payments are not connected.</Muted><Button title={busy ? 'Submitting…' : s.user ? 'Submit order · COD' : 'Sign in to checkout'} disabled={busy} onPress={() => {
        void submit();
      }} /></Card>}{note && <Card><Text accessibilityRole="alert">{note}</Text></Card>}</Shell>;
}
