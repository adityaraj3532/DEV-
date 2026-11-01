import 'react-native-url-polyfill/auto';
import { AppState, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, processLock } from '@supabase/supabase-js';
import config from './supabase-config.json';
export const supabase = createClient(config.url, config.publishableKey, {
  auth: {
    ...(Platform.OS !== 'web' ? {
      storage: AsyncStorage
    } : {}),
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: Platform.OS === 'web',
    lock: processLock
  }
});
if (Platform.OS !== 'web') AppState.addEventListener('change', state => {
  if (state === 'active') supabase.auth.startAutoRefresh();else supabase.auth.stopAutoRefresh();
});
export async function rpc(path: string, method = 'GET', body: Record<string, unknown> = {}) {
  if (path === '/orders' && method === 'POST') {
    const {
      data,
      error
    } = await supabase.functions.invoke('dev-computer-checkout', {
      body
    });
    if (error) {
      let message = error.message;
      try {
        message = (await error.context.json()).error || message;
      } catch {}
      throw Error(message);
    }
    return data;
  }
  const {
    data,
    error
  } = await supabase.rpc('dev_computer_api', {
    p_path: path,
    p_method: method,
    p_body: body
  });
  if (error) throw Error(error.message);
  return data;
}
export type Product = {
  id: number;
  name: string;
  brand: string;
  category: string;
  description: string;
  specifications?: string;
  sku?: string;
  price_paise: number;
  stock: number;
  active: number;
  image_url: string;
  returnable: boolean;
  return_days: number;
};
export type ShopUser = {
  id: string;
  email: string;
  role: 'customer' | 'admin' | 'delivery';
};
export type Order = {
  id: string;
  email: string;
  status: string;
  total_paise: number;
  created: number;
  items: {
    product_id: number;
    name: string;
    quantity: number;
  }[];
  history?: {
    status: string;
    note: string;
    at: number;
  }[];
};
export type Customer = {
  cart?: Record<string, number>;
  wishlist?: number[];
  profile?: {
    name?: string;
    phone?: string;
  };
  addresses?: {
    id: string;
    label: string;
    name: string;
    phone: string;
    line: string;
    city: string;
    state: string;
    pin: string;
  }[];
  defaultAddress?: string;
  later?: number[];
};
export const categories = ['Laptop', 'Desktop', 'Monitor', 'PC Component', 'Keyboard', 'Mouse', 'Printer', 'Networking', 'Software', 'Refurbished', 'Accessory', 'Charger', 'Camera', 'Headphone', 'Speaker', 'Microphone', 'Other'];
export const money = (paise: number) => '₹' + (paise / 100).toLocaleString('en-IN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});
export function checkoutKey() {
  return 'checkout-' + Date.now() + '-' + Math.random().toString(36).slice(2);
}
