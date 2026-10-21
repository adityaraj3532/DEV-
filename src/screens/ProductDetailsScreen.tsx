
import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  Pressable,
  View,
} from "react-native";

export type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  icon: string;
};

type Props = {
  product: Product;
  onBack: () => void;
  onAddToCart: (product: Product, quantity: number) => void;
};

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

export default function ProductDetailsScreen({
  product,
  onBack,
  onAddToCart,
}: Props) {
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState("");

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
    >
      <Pressable onPress={onBack} style={styles.backButton}>
        <Text style={styles.backText}>← Back to products</Text>
      </Pressable>

      <View style={styles.imageBox}>
        <Text style={styles.emoji}>{product.icon}</Text>
      </View>

      <Text style={styles.category}>{product.category}</Text>
      <Text style={styles.name}>{product.name}</Text>
      <Text style={styles.price}>
        ₹{product.price.toLocaleString("en-IN")}
      </Text>

      <Text
        style={[
          styles.stock,
          product.stock === 0 && styles.outOfStock,
        ]}
      >
        {product.stock > 0
          ? `${product.stock} units available`
          : "Out of stock"}
      </Text>

      <View style={styles.divider} />

      <Text style={styles.heading}>About this product</Text>
      <Text style={styles.description}>
        {product.name} is part of our {product.category.toLowerCase()} collection.
        Explore quality technology products at ElectroShop.
      </Text>

      <Text style={styles.heading}>Quantity</Text>

      <View style={styles.quantityRow}>
        <Pressable
          style={[styles.quantityButton, quantity <= 1 && styles.disabled]}
          disabled={quantity <= 1}
          onPress={() => setQuantity((q) => q - 1)}
        >
          <Text style={styles.quantityButtonText}>−</Text>
        </Pressable>

        <Text style={styles.quantity}>{quantity}</Text>

        <Pressable
          style={[
            styles.quantityButton,
            quantity >= product.stock && styles.disabled,
          ]}
          disabled={quantity >= product.stock}
          onPress={() => setQuantity((q) => q + 1)}
        >
          <Text style={styles.quantityButtonText}>+</Text>
        </Pressable>
      </View>

      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total price</Text>
        <Text style={styles.totalPrice}>
          ₹{(product.price * quantity).toLocaleString("en-IN")}
        </Text>
      </View>

      <Pressable
        style={[
          styles.addButton,
          product.stock === 0 && styles.disabledButton,
        ]}
        disabled={product.stock === 0}
        onPress={() => {
          onAddToCart(product, quantity);
          setMessage(`${quantity} item(s) added to cart!`);
        }}
      >
        <Text style={styles.addButtonText}>Add to Cart</Text>
      </Pressable>

      {message ? <Text style={styles.message}>{message}</Text> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.background },
  content: {
    padding: 20,
    paddingBottom: 40,
    width: "100%",
    maxWidth: 750,
    alignSelf: "center",
  },
  backButton: { alignSelf: "flex-start", paddingVertical: 12 },
  backText: { color: C.primary, fontSize: 15, fontWeight: "700" },
  imageBox: {
    height: 230,
    borderRadius: 18,
    backgroundColor: C.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: C.border,
  },
  emoji: { fontSize: 90 },
  category: {
    color: C.primary,
    fontSize: 14,
    fontWeight: "700",
    marginTop: 22,
  },
  name: {
    color: C.text,
    fontSize: 27,
    fontWeight: "800",
    marginTop: 8,
  },
  price: {
    color: C.primary,
    fontSize: 26,
    fontWeight: "800",
    marginTop: 12,
  },
  stock: { color: C.success, fontSize: 14, marginTop: 8 },
  outOfStock: { color: C.danger },
  divider: {
    height: 1,
    backgroundColor: C.border,
    marginVertical: 22,
  },
  heading: {
    color: C.text,
    fontSize: 18,
    fontWeight: "800",
    marginTop: 18,
    marginBottom: 10,
  },
  description: { color: C.muted, fontSize: 15, lineHeight: 24 },
  quantityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
  quantityButton: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: "#E0E9FF",
    alignItems: "center",
    justifyContent: "center",
  },
  quantityButtonText: { fontSize: 24, color: C.primary },
  quantity: {
    color: C.text,
    fontSize: 20,
    fontWeight: "800",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 26,
    marginBottom: 18,
  },
  totalLabel: { color: C.muted, fontSize: 16 },
  totalPrice: { color: C.text, fontSize: 23, fontWeight: "800" },
  addButton: {
    backgroundColor: C.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  addButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" },
  disabled: { opacity: 0.4 },
  disabledButton: { backgroundColor: C.muted },
  message: {
    color: C.success,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 14,
  },
});
