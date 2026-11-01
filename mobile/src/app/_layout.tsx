import React from 'react';
import { Stack } from 'expo-router';
import { ShopProvider } from '../lib/store';
export default function Layout() {
  return <ShopProvider><Stack screenOptions={{
      headerShown: false
    }} /></ShopProvider>;
}
