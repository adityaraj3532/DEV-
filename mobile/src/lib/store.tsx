import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';
import { Customer, Order, Product, rpc, ShopUser, supabase } from './supabase';
type Promotion = {
  id: string;
  title: string;
  description: string;
  kind: string;
  image?: string;
  terms?: string;
  end?: string;
  published: boolean;
  start?: string;
  featured: boolean;
};
type Store = {
  promotions: Promotion[];
  products: Product[];
  orders: Order[];
  user: ShopUser | null;
  customer: Customer;
  cart: Record<string, number>;
  error: string;
  loading: boolean;
  refresh: () => Promise<void>;
  mutate: (path: string, method: string, body?: Record<string, unknown>) => Promise<any>;
  setQuantity: (id: number, quantity: number) => Promise<void>;
  saveCustomer: (value: Customer) => Promise<void>;
  flush: () => Promise<void>;
};
const Context = createContext<Store | null>(null);
export function ShopProvider({
  children
}: {
  children: React.ReactNode;
}) {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [products, setProducts] = useState<Product[]>([]),
    [orders, setOrders] = useState<Order[]>([]),
    [user, setUser] = useState<ShopUser | null>(null),
    [customer, setCustomer] = useState<Customer>({}),
    [error, setError] = useState(''),
    [loading, setLoading] = useState(true);
  const userRef = useRef<ShopUser | null>(null),
    dataRef = useRef<Customer>({}),
    queue = useRef(Promise.resolve()),
    pending = useRef(0),
    saveError = useRef<Error | null>(null),
    request = useRef(0);
  const refresh = useCallback(async () => {
    const id = ++request.current;
    try {
      const data = await rpc('/snapshot');
      if (id !== request.current) return;
      setPromotions(data.promotions || []);
      setProducts(data.products);
      setOrders(data.orders);
      setUser(data.user);
      const changed = userRef.current?.id !== data.user?.id;
      userRef.current = data.user;
      if (!pending.current || changed) {
        let own = data.user ? data.customer : JSON.parse((await AsyncStorage.getItem('dev-computer-guest')) || '{}');
        if (changed && data.user) {
          const guest = JSON.parse((await AsyncStorage.getItem('dev-computer-guest')) || '{}');
          if (Object.keys(guest.cart || {}).length || (guest.wishlist || []).length) {
            own = {
              ...own,
              cart: {
                ...own.cart
              },
              wishlist: [...new Set<number>([...(own.wishlist || []), ...(guest.wishlist || [])])]
            };
            for (const [pid, q] of Object.entries(guest.cart || {})) {
              const p = data.products.find((p: Product) => p.id === Number(pid) && p.active);
              if (p) own.cart[pid] = Math.min(p.stock, (own.cart[pid] || 0) + Number(q));
            }
            await rpc('/customer', 'PUT', own);
            await AsyncStorage.removeItem('dev-computer-guest');
          }
        }
        dataRef.current = own;
        setCustomer(own);
      }
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Cannot connect to store');
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    const initial = setTimeout(() => refresh().catch(() => {}), 0);
    const timer = setInterval(() => refresh().catch(() => {}), 15000);
    const sub = AppState.addEventListener('change', s => {
      if (s === 'active') refresh().catch(() => {});
    });
    const {
      data
    } = supabase.auth.onAuthStateChange(() => {
      setTimeout(() => refresh().catch(() => {}), 0);
    });
    return () => {
      clearTimeout(initial);
      clearInterval(timer);
      sub.remove();
      data.subscription.unsubscribe();
    };
  }, [refresh]);
  async function saveCustomer(value: Customer) {
    const merged = {
      ...dataRef.current,
      ...value
    };
    dataRef.current = merged;
    setCustomer(merged);
    const owner = userRef.current?.id;
    pending.current++;
    const task = queue.current.then(async () => {
      if (owner) {
        if (owner !== userRef.current?.id) throw Error('Account changed. Refresh and try again.');
        await rpc('/customer', 'PUT', merged as Record<string, unknown>);
      } else await AsyncStorage.setItem('dev-computer-guest', JSON.stringify(merged));
    });
    queue.current = task.catch(e => {
      saveError.current = e;
      setError(e.message);
    }).finally(() => {
      pending.current--;
    });
    await task;
  }
  async function flush() {
    await queue.current;
    if (saveError.current) {
      const e = saveError.current;
      saveError.current = null;
      throw e;
    }
  }
  async function setQuantity(id: number, quantity: number) {
    const p = products.find(x => x.id === id && x.active);
    if (quantity > 0 && (!p || quantity > p.stock)) throw Error('Quantity exceeds available stock');
    const next = {
      ...dataRef.current.cart
    };
    if (quantity <= 0) delete next[id];else next[id] = quantity;
    await saveCustomer({
      cart: next
    });
  }
  async function mutate(path: string, method: string, body: Record<string, unknown> = {}) {
    await flush();
    const result = await rpc(path, method, body);
    await refresh();
    return result;
  }
  return <Context.Provider value={{
    promotions,
    products,
    orders,
    user,
    customer,
    cart: customer.cart || {},
    error,
    loading,
    refresh,
    mutate,
    setQuantity,
    saveCustomer,
    flush
  }}>{children}</Context.Provider>;
}
export function useShop() {
  const value = useContext(Context);
  if (!value) throw Error('Missing ShopProvider');
  return value;
}
