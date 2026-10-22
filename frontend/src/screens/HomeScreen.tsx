
import React, { useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import ProductDetailsScreen, {
  type Product,
} from "./ProductDetailsScreen";
import CartScreen, { type CartItem } from "./CartScreen";

const C = {
  primary: "#2563EB",
  background: "#F5F7FB",
  surface: "#FFFFFF",
  text: "#111827",
  muted: "#64748B",
  border: "#E2E8F0",
  success: "#15803D",
  danger: "#DC2626",
};

const initialProducts: Product[] = [
  {
    id: "1",
    name: "MacBook Air M3",
    category: "Laptops",
    price: 99900,
    stock: 5,
    icon: "💻",
  },
  {
    id: "2",
    name: "Samsung Galaxy S24",
    category: "Phones",
    price: 74999,
    stock: 8,
    icon: "📱",
  },
  {
    id: "3",
    name: "Gaming Desktop",
    category: "Desktops",
    price: 85999,
    stock: 3,
    icon: "🖥️",
  },
  {
    id: "4",
    name: "Canon EOS R50",
    category: "Cameras",
    price: 62999,
    stock: 0,
    icon: "📷",
  },
  {
    id: "5",
    name: "Wireless Headphones",
    category: "Accessories",
    price: 4999,
    stock: 12,
    icon: "🎧",
  },
];

const categories = [
  "All",
  "Laptops",
  "Phones",
  "Desktops",
  "Cameras",
  "Accessories",
];

export default function HomeScreen() {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [adminMode, setAdminMode] = useState(false);
  const [selectedProduct, setSelectedProduct] =
    useState<Product | null>(null);
  const [showCart, setShowCart] = useState(false);

  const cartCount = Object.values(cart).reduce(
    (sum, qty) => sum + qty,
    0
  );

  const filtered = useMemo(
    () =>
      products.filter(
        (p) =>
          p.name.toLowerCase().includes(search.trim().toLowerCase()) &&
          (category === "All" || p.category === category)
      ),
    [products, search, category]
  );

  // Update product stock in admin mode.
  function updateStock(id: string, amount: number) {
    setProducts((old) =>
      old.map((p) =>
        p.id === id
          ? { ...p, stock: Math.max(0, p.stock + amount) }
          : p
      )
    );
  }

  // Add products without exceeding available stock.
  function addToCart(product: Product, quantity: number) {
    const latestProduct = products.find((p) => p.id === product.id);
    const alreadyInCart = cart[product.id] ?? 0;

    if (!latestProduct || quantity <= 0) {
      return;
    }

    if (alreadyInCart + quantity > latestProduct.stock) {
      Alert.alert(
        "Not enough stock",
        `Only ${Math.max(
          0,
          latestProduct.stock - alreadyInCart
        )} more item(s) available.`
      );
      return;
    }

    setCart((old) => ({
      ...old,
      [product.id]: (old[product.id] ?? 0) + quantity,
    }));
  }

  // Increase or decrease an item from the cart.
  function changeCartQuantity(id: string, amount: number) {
    const product = products.find((p) => p.id === id);

    if (!product) {
      return;
    }

    const current = cart[id] ?? 0;
    const next = current + amount;

    if (next <= 0) {
      removeFromCart(id);
      return;
    }

    if (next > product.stock) {
      Alert.alert(
        "Stock limit",
        `Only ${product.stock} unit(s) of ${product.name} are available.`
      );
      return;
    }

    setCart((old) => ({
      ...old,
      [id]: next,
    }));
  }

  // Remove a product completely from the cart.
  function removeFromCart(id: string) {
    setCart((old) => {
      const updated = { ...old };
      delete updated[id];
      return updated;
    });
  }

  // Convert the cart state into the format CartScreen expects.
  const cartItems: CartItem[] = products
    .filter((product) => (cart[product.id] ?? 0) > 0)
    .map((product) => ({
      id: product.id,
      name: product.name,
      price: product.price,
      icon: product.icon,
      quantity: cart[product.id] ?? 0,
    }));

  // Product details screen.
  if (selectedProduct) {
    const currentProduct =
      products.find((p) => p.id === selectedProduct.id) ??
      selectedProduct;

    return (
      <ProductDetailsScreen
        product={{
          ...currentProduct,
          stock: Math.max(
            0,
            currentProduct.stock - (cart[currentProduct.id] ?? 0)
          ),
        }}
        onBack={() => setSelectedProduct(null)}
        onAddToCart={addToCart}
      />
    );
  }

  // Cart screen.
  if (showCart) {
    return (
      <CartScreen
        items={cartItems}
        onBack={() => setShowCart(false)}
        onChangeQuantity={changeCartQuantity}
        onRemove={removeFromCart}
        onCheckout={() =>
          Alert.alert(
            "Checkout",
            "Checkout UI will be implemented next."
          )
        }
      />
    );
  }

  // Main home screen.
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.brand}>ElectroShop.</Text>
          <Text style={styles.muted}>Your everyday tech store</Text>
        </View>

        <Pressable
          style={styles.modeButton}
          onPress={() => setAdminMode((v) => !v)}
        >
          <Text style={styles.modeText}>
            {adminMode ? "Customer" : "Shop Admin"}
          </Text>
        </Pressable>
      </View>

      <View style={styles.banner}>
        <Text style={styles.eyebrow}>THE LATEST TECHNOLOGY</Text>
        <Text style={styles.bannerTitle}>
          Upgrade your{"\n"}everyday.
        </Text>
        <Text style={styles.bannerText}>
          Discover laptops, phones, cameras and more.
        </Text>
        <Text style={styles.bannerIcons}>💻   📱   🎧   📷</Text>
      </View>

      <TextInput
        style={styles.search}
        value={search}
        onChangeText={setSearch}
        placeholder="Search electronics..."
        placeholderTextColor={C.muted}
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categories}
      >
        {categories.map((item) => (
          <Pressable
            key={item}
            onPress={() => setCategory(item)}
            style={[
              styles.categoryButton,
              category === item && styles.categoryActive,
            ]}
          >
            <Text
              style={[
                styles.categoryText,
                category === item && styles.categoryTextActive,
              ]}
            >
              {item}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>
            {adminMode ? "Manage inventory" : "Featured products"}
          </Text>
          <Text style={styles.muted}>
            {filtered.length} products found
          </Text>
        </View>

        {!adminMode && (
          <Pressable
            style={styles.cartButton}
            onPress={() => setShowCart(true)}
          >
            <Text style={styles.cart}>Cart ({cartCount})</Text>
          </Pressable>
        )}
      </View>

      {filtered.map((p) => {
        const quantityInCart = cart[p.id] ?? 0;
        const available = Math.max(0, p.stock - quantityInCart);

        return (
          <View key={p.id} style={styles.card}>
            <Pressable
              style={styles.image}
              onPress={() => !adminMode && setSelectedProduct(p)}
              disabled={adminMode}
            >
              <Text style={styles.emoji}>{p.icon}</Text>
            </Pressable>

            <View style={styles.details}>
              <Text style={styles.muted}>{p.category}</Text>

              <Pressable
                onPress={() => !adminMode && setSelectedProduct(p)}
                disabled={adminMode}
              >
                <Text style={styles.name}>{p.name}</Text>
              </Pressable>

              <Text style={styles.price}>
                ₹{p.price.toLocaleString("en-IN")}
              </Text>

              <Text
                style={[
                  styles.stock,
                  available === 0 && styles.out,
                ]}
              >
                {available > 0
                  ? `${available} in stock`
                  : "Out of stock"}
              </Text>

              {adminMode ? (
                <View style={styles.stockControls}>
                  <Pressable
                    style={styles.stockButton}
                    onPress={() => updateStock(p.id, -1)}
                  >
                    <Text style={styles.stockButtonText}>−</Text>
                  </Pressable>

                  <Text style={styles.stockNumber}>{p.stock}</Text>

                  <Pressable
                    style={styles.stockButton}
                    onPress={() => updateStock(p.id, 1)}
                  >
                    <Text style={styles.stockButtonText}>+</Text>
                  </Pressable>
                </View>
              ) : (
                <View style={styles.productActions}>
                  <Pressable
                    style={styles.detailsButton}
                    onPress={() => setSelectedProduct(p)}
                  >
                    <Text style={styles.detailsText}>View details</Text>
                  </Pressable>

                  <Pressable
                    disabled={available === 0}
                    style={[
                      styles.addButton,
                      available === 0 && styles.disabled,
                    ]}
                    onPress={() => addToCart(p, 1)}
                  >
                    <Text style={styles.addText}>
                      {available === 0 ? "Unavailable" : "Add +"}
                    </Text>
                  </Pressable>
                </View>
              )}
            </View>
          </View>
        );
      })}

      {filtered.length === 0 && (
        <Text style={styles.empty}>No products found.</Text>
      )}

      <Text style={styles.footer}>
        ElectroShop · Technology made simple
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: C.background,
  },
  content: {
    paddingBottom: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
  },
  brand: {
    fontSize: 25,
    fontWeight: "800",
    color: C.primary,
  },
  muted: {
    color: C.muted,
    fontSize: 12,
    marginTop: 4,
  },
  modeButton: {
    padding: 11,
    borderRadius: 12,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
  },
  modeText: {
    color: C.primary,
    fontWeight: "700",
    fontSize: 12,
  },
  banner: {
    backgroundColor: C.primary,
    marginHorizontal: 20,
    padding: 24,
    borderRadius: 20,
  },
  eyebrow: {
    color: "#DBEAFE",
    fontSize: 11,
    fontWeight: "800",
  },
  bannerTitle: {
    color: "#FFFFFF",
    fontSize: 34,
    fontWeight: "800",
    marginTop: 14,
  },
  bannerText: {
    color: "#E5EDFF",
    fontSize: 14,
    marginTop: 10,
  },
  bannerIcons: {
    fontSize: 27,
    marginTop: 18,
  },
  search: {
    marginHorizontal: 20,
    marginTop: 20,
    padding: 15,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    color: C.text,
    fontSize: 15,
  },
  categories: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
  },
  categoryActive: {
    backgroundColor: C.primary,
    borderColor: C.primary,
  },
  categoryText: {
    color: C.text,
    fontWeight: "600",
    fontSize: 12,
  },
  categoryTextActive: {
    color: "#FFFFFF",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 20,
    marginBottom: 14,
  },
  sectionTitle: {
    color: C.text,
    fontSize: 21,
    fontWeight: "800",
  },
  cartButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surface,
  },
  cart: {
    color: C.primary,
    fontWeight: "800",
    fontSize: 16,
  },
  card: {
    flexDirection: "row",
    gap: 14,
    padding: 14,
    marginHorizontal: 20,
    marginBottom: 14,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 14,
  },
  image: {
    width: 86,
    minHeight: 110,
    borderRadius: 12,
    backgroundColor: C.background,
    alignItems: "center",
    justifyContent: "center",
  },
  emoji: {
    fontSize: 38,
  },
  details: {
    flex: 1,
    justifyContent: "center",
  },
  name: {
    color: C.text,
    fontWeight: "700",
    fontSize: 15,
    marginTop: 4,
  },
  price: {
    color: C.primary,
    fontWeight: "800",
    fontSize: 21,
    marginTop: 8,
  },
  stock: {
    color: C.success,
    fontSize: 12,
    marginTop: 5,
  },
  out: {
    color: C.danger,
  },
  productActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
    marginTop: 10,
  },
  detailsButton: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.border,
  },
  detailsText: {
    color: C.primary,
    fontSize: 12,
    fontWeight: "700",
  },
  addButton: {
    backgroundColor: C.primary,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  disabled: {
    backgroundColor: C.muted,
  },
  stockControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginTop: 10,
  },
  stockButton: {
    width: 34,
    height: 34,
    backgroundColor: C.background,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  stockButtonText: {
    fontSize: 22,
    color: C.text,
  },
  stockNumber: {
    color: C.text,
    fontWeight: "700",
  },
  empty: {
    textAlign: "center",
    color: C.muted,
    padding: 24,
  },
  footer: {
    color: C.muted,
    textAlign: "center",
    fontSize: 12,
    padding: 24,
  },
});
