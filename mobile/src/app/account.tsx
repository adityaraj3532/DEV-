import React, { useState } from 'react';
import { Text } from 'react-native';
import { router } from 'expo-router';
import { Button, Card, Field, Muted, Row, Shell, Title } from '../components/ui';
import { useShop } from '../lib/store';
import { money, supabase } from '../lib/supabase';
export default function Account() {
  const shop = useShop(),
    [name, setName] = useState(''),
    [phone, setPhone] = useState(''),
    [address, setAddress] = useState(''),
    [city, setCity] = useState(''),
    [region, setRegion] = useState(''),
    [pin, setPin] = useState(''),
    [note, setNote] = useState('');
  if (!shop.user) return <Shell><Card><Title>Your account</Title><Muted>Sign in to view your private orders, profile and saved addresses.</Muted><Button title="Sign in" onPress={() => router.push('/login')} /></Card></Shell>;
  return <Shell><Title>My account</Title><Muted>{shop.user.email} · {shop.user.role}</Muted><Card><Title>Personal details</Title><Muted>{shop.customer.profile?.name || 'No name saved'} · {shop.customer.profile?.phone || 'No phone saved'}</Muted><Field label="Full name" value={name} onChangeText={setName} /><Field label="Mobile number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" /><Button title="Save profile" onPress={() => {
        if (name.trim().length < 2 || !/^[6-9][0-9]{9}$/.test(phone)) {
          setNote('Enter a name and valid Indian mobile number.');
          return;
        }
        shop.saveCustomer({
          profile: {
            name: name.trim(),
            phone
          }
        }).then(() => setNote('Profile saved')).catch(e => setNote(e.message));
      }} /></Card><Card><Title>Saved addresses</Title>{shop.customer.addresses?.map(a => <Text key={a.id}>{a.label}: {a.line}, {a.city}, {a.state} {a.pin}</Text>)}<Field label="House, street and locality" value={address} onChangeText={setAddress} /><Field label="City" value={city} onChangeText={setCity} /><Field label="State" value={region} onChangeText={setRegion} /><Field label="PIN code" value={pin} onChangeText={setPin} keyboardType="numeric" /><Button title="Add home address" onPress={() => {
        if (!name.trim() || !/^[6-9][0-9]{9}$/.test(phone) || address.trim().length < 5 || !city.trim() || !region.trim() || !/^[1-9][0-9]{5}$/.test(pin)) {
          setNote('Fill profile name/phone and all address fields.');
          return;
        }
        const a = {
          id: 'ADDR-' + Date.now(),
          label: 'Home',
          name,
          phone,
          line: address,
          city,
          state: region,
          pin
        };
        shop.saveCustomer({
          addresses: [...(shop.customer.addresses || []), a]
        }).then(() => setNote('Address saved')).catch(e => setNote(e.message));
      }} /></Card><Title>Order history & tracking</Title>{shop.orders.filter(o => o.email === shop.user?.email).map(o => <Card key={o.id}><Text style={{
        fontWeight: '700'
      }}>{o.id}</Text><Text>{o.status} · {money(o.total_paise)}</Text>{o.items.map(i => <Muted key={i.product_id}>{i.name} × {i.quantity}</Muted>)}{o.history?.map((h, i) => <Muted key={i}>{h.status}: {h.note}</Muted>)}{['Placed', 'Confirmed'].includes(o.status) && <Button title="Cancel this order" secondary onPress={() => shop.mutate('/orders/' + o.id + '/cancel', 'POST').then(() => setNote('Order cancelled; stock restored.')).catch(e => setNote(e.message))} />}</Card>)}{!shop.orders.length && <Muted>No orders yet.</Muted>}<Title>Wishlist</Title>{(shop.customer.wishlist || []).map(id => {
      const p = shop.products.find(p => p.id === id);
      return p ? <Button key={id} title={p.name} secondary onPress={() => router.push(`/product/${id}`)} /> : null;
    })}{note && <Card><Text>{note}</Text></Card>}<Row><Button title="Refresh account" secondary onPress={() => shop.refresh().catch(e => setNote(e.message))} /><Button title="Sign out" secondary onPress={async () => {
        try {
          await shop.flush();
          const {
            error
          } = await supabase.auth.signOut();
          if (error) throw error;
          await shop.refresh();
        } catch (e) {
          setNote((e as Error).message);
        }
      }} /></Row></Shell>;
}
