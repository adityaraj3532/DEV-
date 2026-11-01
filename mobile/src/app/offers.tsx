import React, { useState } from 'react';
import { Image, Text } from 'react-native';
import { Button, Card, Muted, Row, Shell, Title } from '../components/ui';
import { useShop } from '../lib/store';
export default function Offers() {
  const {
      promotions
    } = useShop(),
    [kind, setKind] = useState('All');
  const now=new Date();const today=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
  const items = promotions.filter(p => p.published && (!p.start || p.start <= today) && (!p.end || p.end >= today) && (kind === 'All' || p.kind === kind));
  return <Shell><Title>Offers & events</Title><Muted>Current store announcements. Offers use listed product prices; no automatic coupon discount is applied.</Muted><Row>{['All', 'Offer', 'Event'].map(k => <Button key={k} title={k} secondary={kind !== k} onPress={() => setKind(k)} />)}</Row>{items.map(p => <Card key={p.id}>{p.image && <Image source={{
        uri: p.image
      }} accessibilityLabel={p.title} style={{
        height: 170,
        resizeMode: 'cover',
        borderRadius: 12
      }} />}<Muted>{p.kind}</Muted><Title>{p.title}</Title><Text>{p.description}</Text>{p.terms && <Muted>{p.terms}</Muted>}{p.end && <Muted>Through {p.end}</Muted>}</Card>)}{!items.length && <Card><Muted>No current offers or events. Check back soon.</Muted></Card>}</Shell>;
}
