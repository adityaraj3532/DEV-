import React, { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Card, Field, Muted, Row, Shell, Title } from '../components/ui';
import { categories, money, Product } from '../lib/supabase';
import { pickProductImage } from '../lib/upload';
import { useShop } from '../lib/store';
type Draft = {
  id?: number;
  name: string;
  brand: string;
  category: string;
  description: string;
  specifications: string;
  sku: string;
  price: string;
  stock: string;
  expected_stock?: number;
  image_url: string;
  returnable: boolean;
  return_days: number;
};
const blank: Draft = {
  name: '',
  brand: '',
  category: 'Laptop',
  description: '',
  specifications: '',
  sku: '',
  price: '',
  stock: '0',
  image_url: '',
  returnable: false,
  return_days: 7
};
export default function Admin() {
  const shop = useShop(),
    [draft, setDraft] = useState<Draft | null>(null),
    [inventory, setInventory] = useState<Product | null>(null),
    [delta, setDelta] = useState(''),
    [reason, setReason] = useState(''),
    [note, setNote] = useState(''),
    [busy, setBusy] = useState(false),
    [remove, setRemove] = useState<number | null>(null);
  function edit(p: Product) {
    setDraft({
      ...p,
      price: String(p.price_paise / 100),
      stock: String(p.stock),
      expected_stock: p.stock,
      sku: p.sku || '',
      specifications: p.specifications || ''
    });
  }
  async function save() {
    if (!draft) return;
    setBusy(true);
    try {
      await shop.mutate('/admin/products' + (draft.id ? '/' + draft.id : ''), draft.id ? 'PUT' : 'POST', {
        ...draft,
        price_paise: Math.round(Number(draft.price) * 100),
        stock: Number(draft.stock)
      });
      setDraft(null);
      setNote('Product saved to the shared catalogue.');
    } catch (e) {
      setNote((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  if (shop.user?.role !== 'admin') return <Shell><Card><Title>Owner dashboard</Title><Muted>Only the configured store owner can manage real inventory and orders. Role checks run on the server.</Muted><Button title="Sign in as owner" onPress={() => router.push('/login')} /></Card></Shell>;
  return <Shell><Title>Store management</Title><Row><Card><Title>{shop.products.filter(p => p.active).length}</Title><Muted>Active products</Muted></Card><Card><Title>{shop.products.filter(p => p.active && p.stock <= 5).length}</Title><Muted>Low-stock alerts (≤5)</Muted></Card><Card><Title>{shop.orders.filter(o => o.status === 'Placed').length}</Title><Muted>Awaiting confirmation</Muted></Card></Row>{note && <Card><Text accessibilityRole="alert">{note}</Text></Card>}<Button title="＋ Add product" onPress={() => {
      setDraft({
        ...blank
      });
      setInventory(null);
    }} />{draft && <Card><Title>{draft.id ? 'Edit product' : 'New product'}</Title><Field label="Product name" value={draft.name} onChangeText={name => setDraft({
        ...draft,
        name
      })} /><Field label="Brand" value={draft.brand} onChangeText={brand => setDraft({
        ...draft,
        brand
      })} /><Muted>Category</Muted><ScrollView horizontal><Row>{categories.map(c => <Button key={c} title={c} secondary={draft.category !== c} onPress={() => setDraft({
            ...draft,
            category: c
          })} />)}</Row></ScrollView><Field label="SKU / barcode" value={draft.sku} onChangeText={sku => setDraft({
        ...draft,
        sku
      })} /><Field label="Description" value={draft.description} multiline onChangeText={description => setDraft({
        ...draft,
        description
      })} /><Field label="Specifications" value={draft.specifications} multiline onChangeText={specifications => setDraft({
        ...draft,
        specifications
      })} /><Field label="Price (₹)" keyboardType="numeric" value={draft.price} onChangeText={price => setDraft({
        ...draft,
        price
      })} /><Field label="Stock" keyboardType="numeric" value={draft.stock} onChangeText={stock => setDraft({
        ...draft,
        stock
      })} /><Field label="HTTPS product image URL" value={draft.image_url} onChangeText={image_url => setDraft({
        ...draft,
        image_url
      })} autoCapitalize="none" /><Button title="Upload product photo" secondary disabled={busy} onPress={async () => {
        setBusy(true);
        try {
          const url = await pickProductImage();
          if (url) setDraft({
            ...draft,
            image_url: url
          });
        } catch (e) {
          setNote((e as Error).message);
        } finally {
          setBusy(false);
        }
      }} /><Muted>Photos are compressed and uploaded to Supabase Storage.</Muted><Row><Button title={draft.returnable ? 'Returnable · 7 days' : 'Not returnable'} secondary onPress={() => setDraft({
          ...draft,
          returnable: !draft.returnable,
          return_days: 7
        })} /><Button title={busy ? 'Saving…' : 'Save product'} disabled={busy} onPress={save} /><Button title="Cancel" secondary onPress={() => setDraft(null)} /></Row></Card>}{inventory && <Card><Title>Adjust {inventory.name}</Title><Field label="Stock change (+10 or -2)" value={delta} onChangeText={setDelta} keyboardType="numbers-and-punctuation" /><Field label="Reason" value={reason} onChangeText={setReason} /><Button title="Save adjustment" disabled={busy} onPress={async () => {
        setBusy(true);
        try {
          await shop.mutate('/admin/inventory/' + inventory.id, 'POST', {
            delta: Number(delta),
            reason
          });
          setInventory(null);
          setNote('Adjustment saved and audited.');
        } catch (e) {
          setNote((e as Error).message);
        } finally {
          setBusy(false);
        }
      }} /></Card>}<Title>Inventory</Title>{shop.products.filter(p => p.active).map(p => <Card key={p.id}><Text style={{
        fontSize: 18,
        fontWeight: '700'
      }}>{p.name}</Text><Muted>{p.sku || 'No SKU'} · {money(p.price_paise)} · {p.stock} in stock {p.stock <= 5 ? '· LOW STOCK' : ''}</Muted><Row><Button title="Edit" secondary onPress={() => edit(p)} /><Button title="Adjust stock" secondary onPress={() => {
          setInventory(p);
          setDelta('');
          setReason('');
          setDraft(null);
        }} /><Button title={remove === p.id ? 'Confirm remove' : 'Remove'} secondary onPress={() => {
          if (remove !== p.id) {
            setRemove(p.id);
            return;
          }
          shop.mutate('/admin/products/' + p.id, 'DELETE').then(() => {
            setRemove(null);
            setNote('Product removed from sale.');
          }).catch(e => setNote(e.message));
        }} /></Row></Card>)}<Title>Orders</Title>{shop.orders.map(o => <Card key={o.id}><Text>{o.id} · {o.status}</Text><Muted>{money(o.total_paise)}</Muted>{o.items.map(i => <Text key={i.product_id}>{i.name} × {i.quantity}</Text>)}<View>{o.status === 'Placed' ? <Row><Button title="Confirm order" onPress={() => shop.mutate('/admin/orders/' + o.id, 'PUT', {
            status: 'Confirmed',
            note: 'Owner confirmed the order.'
          }).then(() => setNote('Order confirmed.')).catch(e => setNote(e.message))} /><Button title="Reject order" secondary onPress={() => shop.mutate('/admin/orders/' + o.id, 'PUT', {
            status: 'Cancelled',
            note: 'Owner rejected the order.'
          }).catch(e => setNote(e.message))} /></Row> : o.status === 'Confirmed' ? <Button title="Mark shipped" onPress={() => shop.mutate('/admin/orders/' + o.id, 'PUT', {
          status: 'Shipped',
          note: 'Dispatched by the store.'
        }).catch(e => setNote(e.message))} /> : o.status === 'Shipped' ? <Button title="Mark delivered" onPress={() => shop.mutate('/admin/orders/' + o.id, 'PUT', {
          status: 'Delivered',
          note: 'Delivery completed.'
        }).catch(e => setNote(e.message))} /> : null}</View></Card>)}<Button title="Refresh store" secondary onPress={() => shop.refresh().catch(e => setNote(e.message))} /></Shell>;
}
