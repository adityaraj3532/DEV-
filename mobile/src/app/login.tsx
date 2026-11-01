import React, { useRef, useState } from 'react';
import { Platform, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { Button, Card, Field, Muted, Shell, Title } from '../components/ui';
import { supabase } from '../lib/supabase';
import config from '../lib/supabase-config.json';
import { useShop } from '../lib/store';
export default function Login() {
  const [email, setEmail] = useState(''),
    [code, setCode] = useState(''),
    [note, setNote] = useState(''),
    [busy, setBusy] = useState(false),
    [until, setUntil] = useState(0),
    sending = useRef(false);
  const shop = useShop();
  async function send() {
    if (sending.current) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setNote('Enter a valid email address.');
      return;
    }
    sending.current = true;
    setBusy(true);
    try {
      const remaining = Math.max(until,Number(await AsyncStorage.getItem('dev-computer-email-after')||0))-Date.now();
      if(remaining>0){setNote(`Please wait ${Math.ceil(remaining/1000)} seconds. You can still verify an existing email.`);return;}
      const next=Date.now()+60000;setUntil(next);await AsyncStorage.setItem('dev-computer-email-after',String(next));
      const {
        error
      } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: Platform.OS === 'web' ? {
          emailRedirectTo: Linking.createURL('/login')
        } : undefined
      });
      if (error) throw error;
      setNote('Check your email. Enter its code or paste its verification link below.');
    } catch (e) {
      setNote(/rate|limit/i.test((e as Error).message) ? 'Supabase email quota reached. Use an existing unexpired code/link, or configure custom SMTP. Waiting 60 seconds does not reset the server quota.' : (e as Error).message);
    } finally {
      sending.current = false;
      setBusy(false);
    }
  }
  async function verify() {
    setBusy(true);
    try {
      let result;
      if (code.trim().startsWith('https://')) {
        const url = new URL(code.trim());
        if (url.origin !== config.url) throw Error('Use this project’s Supabase verification link.');
        const token_hash = url.searchParams.get('token_hash') || url.searchParams.get('token'),
          type = url.searchParams.get('type');
        if (!token_hash || !['email', 'magiclink', 'signup'].includes(type || '')) throw Error('Invalid verification link.');
        result = await supabase.auth.verifyOtp({
          token_hash,
          type: type as 'email'
        });
      } else result = await supabase.auth.verifyOtp({
        email: email.trim().toLowerCase(),
        token: code.trim(),
        type: 'email'
      });
      if (result.error) throw result.error;
      await shop.refresh();
      router.replace('/account');
    } catch (e) {
      setNote((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return <Shell><Card><Title>Welcome to Dev Computer</Title><Muted>Real accounts protect customer details, inventory and orders. Browse freely; sign in to purchase or manage the store.</Muted><Field label="Email" autoCapitalize="none" keyboardType="email-address" autoComplete="email" value={email} onChangeText={setEmail} /><Button title={busy ? 'Please wait…' : 'Send sign-in email'} disabled={busy} onPress={send} /><Muted>Requests are limited to one per minute. Email provider quotas may be longer.</Muted><Field label="Existing email code or verification link" value={code} onChangeText={setCode} autoCapitalize="none" /><Button title="Verify and sign in" disabled={busy || !code.trim()} onPress={verify} />{note && <Text accessibilityRole="alert">{note}</Text>}<Muted>Owner: adityaraj3532@gmail.com. Numeric codes require the email template to include the OTP token; verification links are also supported.</Muted></Card></Shell>;
}
