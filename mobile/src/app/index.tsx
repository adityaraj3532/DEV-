import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { Button, Card, Field, Muted, Row, Shell, styles, Title } from '../components/ui';
import { categories, money } from '../lib/supabase';
import { useShop } from '../lib/store';
export default function Catalogue() {
  const shop = useShop(),
    {
      width
    } = useWindowDimensions();
  const [q, setQ] = useState(''),
    [category, setCategory] = useState(''),
    [brand, setBrand] = useState(''),
    [budget, setBudget] = useState(''),
    [sort, setSort] = useState(false),
    [note, setNote] = useState('');
  const products = useMemo(() => shop.products.filter(p => p.active && (!category || p.category === category) && (!brand || p.brand === brand) && (!budget || p.price_paise <= Number(budget) * 100) && `${p.name} ${p.brand} ${p.sku}`.toLowerCase().includes(q.toLowerCase())).sort((a, b) => sort ? a.price_paise - b.price_paise : b.id - a.id), [shop.products, q, category, brand, budget, sort]);
  return <Shell><View style={styles.hero}><Text style={{
        color: '#ffab70',
        fontWeight: '700',
        letterSpacing: 2
      }}>BUILT AROUND YOUR NEXT UPGRADE</Text><Text style={{
        color: '#fff',
        fontSize: width > 650 ? 42 : 30,
        fontWeight: '800'
      }}>Work smarter. Play bigger.</Text><Text style={{
        color: '#d5e0ef',
        lineHeight: 23
      }}>Computers, components and everyday essentials — with expert help from Dev Computer.</Text><Row><Button title="Browse laptops" onPress={() => setCategory('Laptop')} /><Button title="All products" secondary onPress={() => setCategory('')} /></Row></View><Title>Find your next upgrade</Title><Card><Field label="Search products" value={q} onChangeText={setQ} placeholder="Search by name, brand or SKU" /><Row><View style={{
          flex: 1,
          minWidth: 150
        }}><Field label="Maximum price (₹)" keyboardType="numeric" value={budget} onChangeText={setBudget} /></View><Button title={sort ? 'Price: low to high' : 'Newest first'} secondary onPress={() => setSort(!sort)} /><Button title="Clear filters" secondary onPress={() => {
          setQ('');
          setCategory('');
          setBrand('');
          setBudget('');
        }} /></Row></Card><ScrollView horizontal showsHorizontalScrollIndicator={false}><Row><Button title="All categories" secondary={!!category} onPress={() => setCategory('')} />{categories.map(c => <Button key={c} title={c} secondary={category !== c} onPress={() => setCategory(c)} />)}</Row></ScrollView><ScrollView horizontal><Row><Button title="All brands" secondary={!!brand} onPress={() => setBrand('')} />{[...new Set(shop.products.map(p => p.brand))].map(b => <Button key={b} title={b} secondary={brand !== b} onPress={() => setBrand(b)} />)}</Row></ScrollView>{shop.loading && <ActivityIndicator />}{shop.error && <Card><Text>{shop.error}</Text><Button title="Retry connection" onPress={() => shop.refresh().catch(() => {})} /></Card>}{note && <Muted>{note}</Muted>}<Muted>{products.length} products · Cloud inventory refreshes every 15 seconds</Muted><View style={{
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 16
    }}>{products.map(p => <View key={p.id} style={{
        width: width > 1000 ? '31.8%' : width > 620 ? '48%' : '100%'
      }}><Card>{p.image_url ? <Image source={{
            uri: p.image_url
          }} accessibilityLabel={p.name} style={{
            height: 170,
            width: '100%',
            resizeMode: 'contain'
          }} /> : <View style={{
            height: 140,
            backgroundColor: '#f1f4fa',
            borderRadius: 12,
            justifyContent: 'center',
            alignItems: 'center'
          }}><Text style={{
              fontSize: 46
            }}>▣</Text></View>}<Muted>{p.brand} · {p.category}</Muted><Text style={{
            fontSize: 18,
            fontWeight: '700'
          }}>{p.name}</Text><Text style={styles.price}>{money(p.price_paise)}</Text><Muted>{p.stock ? p.stock + ' in stock' : 'Out of stock'}</Muted><Row><Button title="View details" secondary onPress={() => router.push(`/product/${p.id}`)} /><Button title="Add to cart" disabled={!p.stock} onPress={() => shop.setQuantity(p.id, (shop.cart[p.id] || 0) + 1).then(() => setNote(p.name + ' added')).catch(e => setNote(e.message))} /></Row></Card></View>)}</View>{!shop.loading && !products.length && <Card><Title>{shop.products.length ? 'No matching products' : 'Your connected catalogue is ready'}</Title><Muted>{shop.products.length ? 'Try a different filter.' : 'The owner can sign in and add real products. No sample inventory is listed for sale.'}</Muted><Button title="Open owner panel" onPress={() => router.push('/admin')} /></Card>}</Shell>;
}
