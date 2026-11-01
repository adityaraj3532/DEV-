import React, { useState } from 'react';
import { Image, Text } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Button, Card, Muted, Row, Shell, styles, Title } from '../../components/ui';
import { useShop } from '../../lib/store';
import { money } from '../../lib/supabase';
export default function ProductDetails() {
  const {
      id
    } = useLocalSearchParams(),
    shop = useShop(),
    p = shop.products.find(p => p.id === Number(id)),
    [note, setNote] = useState('');
  if (!p) return <Shell><Title>Product unavailable</Title><Button title="Back to catalogue" onPress={() => router.replace('/')} /></Shell>;
  const wished = (shop.customer.wishlist || []).includes(p.id);
  return <Shell><Card>{p.image_url && <Image source={{
        uri: p.image_url
      }} accessibilityLabel={p.name} style={{
        height: 260,
        resizeMode: 'contain'
      }} />}<Muted>{p.brand} · {p.category}</Muted><Title>{p.name}</Title><Text style={styles.price}>{money(p.price_paise)}</Text><Text>{p.description}</Text><Title>Specifications</Title><Text style={{
        lineHeight: 25
      }}>{p.specifications || 'Contact the store for full specifications.'}</Text><Muted>SKU: {p.sku || 'Not provided'} · {p.stock} in stock</Muted><Muted>{p.returnable ? `Returnable within ${p.return_days} days after delivery` : 'This product is not returnable'}</Muted><Row><Button title="Add to cart" disabled={!p.stock} onPress={() => shop.setQuantity(p.id, (shop.cart[p.id] || 0) + 1).then(() => setNote('Added to cart')).catch(e => setNote(e.message))} /><Button title={wished ? '♥ Saved' : '♡ Wishlist'} secondary onPress={() => shop.saveCustomer({
          wishlist: wished ? (shop.customer.wishlist || []).filter(id => id !== p.id) : [...(shop.customer.wishlist || []), p.id]
        }).catch(e => setNote(e.message))} /><Button title="Back" secondary onPress={() => router.back()} /></Row>{note && <Text>{note}</Text>}</Card></Shell>;
}
