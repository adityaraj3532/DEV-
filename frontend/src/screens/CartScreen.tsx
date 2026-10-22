
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  Pressable,
  View,
} from "react-native";

export type CartItem = {
  id: string;
  name: string;
  price: number;
  icon: string;
  quantity: number;
};

type Props = {
  items: CartItem[];
  onBack: () => void;
  onChangeQuantity: (id: string, amount: number) => void;
  onRemove: (id: string) => void;
  onCheckout: () => void;
};

const C = {
  primary: "#2563EB",
  background: "#F5F7FB",
  surface: "#FFFFFF",
  text: "#111827",
  muted: "#64748B",
  border: "#E2E8F0",
  danger: "#DC2626",
};

export default function CartScreen({
  items,
  onBack,
  onChangeQuantity,
  onRemove,
  onCheckout,
}: Props) {
  const total = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const money = (amount: number) =>
    `₹${amount.toLocaleString("en-IN")}`;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
    >
      <Pressable onPress={onBack} style={styles.backButton}>
        <Text style={styles.back}>← Back to shopping</Text>
      </Pressable>

      <Text style={styles.title}>Your Cart</Text>
      <Text style={styles.subtitle}>
        {items.reduce((sum, item) => sum + item.quantity, 0)} item(s)
        in your cart
      </Text>

      {items.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🛒</Text>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.subtitle}>
            Add some products to get started.
          </Text>

          <Pressable style={styles.primaryButton} onPress={onBack}>
            <Text style={styles.primaryButtonText}>
              Continue shopping
            </Text>
          </Pressable>
        </View>
      ) : (
        <>
          {items.map((item) => (
            <View key={item.id} style={styles.card}>
              <View style={styles.productIcon}>
                <Text style={styles.emoji}>{item.icon}</Text>
              </View>

              <View style={styles.productInfo}>
                <Text style={styles.productName}>{item.name}</Text>
                <Text style={styles.price}>{money(item.price)}</Text>

                <View style={styles.quantityRow}>
                  <Pressable
                    style={styles.quantityButton}
                    onPress={() => onChangeQuantity(item.id, -1)}
                  >
                    <Text style={styles.quantityButtonText}>−</Text>
                  </Pressable>

                  <Text style={styles.quantity}>{item.quantity}</Text>

                  <Pressable
                    style={styles.quantityButton}
                    onPress={() => onChangeQuantity(item.id, 1)}
                  >
                    <Text style={styles.quantityButtonText}>+</Text>
                  </Pressable>
                </View>
              </View>

              <View style={styles.itemEnd}>
                <Text style={styles.lineTotal}>
                  {money(item.price * item.quantity)}
                </Text>

                <Pressable onPress={() => onRemove(item.id)}>
                  <Text style={styles.remove}>Remove</Text>
                </Pressable>
              </View>
            </View>
          ))}

          <View style={styles.summary}>
            <Text style={styles.summaryTitle}>Order summary</Text>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>{money(total)}</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Delivery</Text>
              <Text style={styles.free}>FREE</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{money(total)}</Text>
            </View>

            <Pressable
              style={styles.primaryButton}
              onPress={onCheckout}
            >
              <Text style={styles.primaryButtonText}>
                Proceed to checkout →
              </Text>
            </Pressable>

            <Text style={styles.note}>
              Taxes and final charges will be confirmed at checkout.
            </Text>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: C.background,
  },
  content: {
    padding: 20,
    paddingBottom: 36,
  },
  backButton: {
    alignSelf: "flex-start",
    paddingVertical: 8,
  },
  back: {
    color: C.primary,
    fontWeight: "700",
    fontSize: 14,
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: C.text,
    marginTop: 16,
  },
  subtitle: {
    fontSize: 13,
    color: C.muted,
    marginTop: 6,
  },
  empty: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 16,
    alignItems: "center",
    padding: 28,
    marginTop: 24,
  },
  emptyIcon: {
    fontSize: 48,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: C.text,
    marginTop: 14,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    marginTop: 14,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 14,
  },
  productIcon: {
    width: 60,
    height: 70,
    borderRadius: 10,
    backgroundColor: C.background,
    alignItems: "center",
    justifyContent: "center",
  },
  emoji: {
    fontSize: 30,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    color: C.text,
    fontWeight: "700",
    fontSize: 14,
  },
  price: {
    color: C.primary,
    fontWeight: "700",
    marginTop: 6,
  },
  quantityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 10,
  },
  quantityButton: {
    width: 30,
    height: 30,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: "center",
    justifyContent: "center",
  },
  quantityButtonText: {
    fontSize: 19,
    color: C.text,
  },
  quantity: {
    color: C.text,
    fontWeight: "700",
  },
  itemEnd: {
    alignItems: "flex-end",
    gap: 12,
  },
  lineTotal: {
    color: C.text,
    fontWeight: "800",
    fontSize: 13,
  },
  remove: {
    color: C.danger,
    fontSize: 12,
    fontWeight: "700",
  },
  summary: {
    marginTop: 22,
    padding: 18,
    borderRadius: 14,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
  },
  summaryTitle: {
    fontSize: 19,
    color: C.text,
    fontWeight: "800",
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 8,
  },
  summaryLabel: {
    color: C.muted,
    fontSize: 14,
  },
  summaryValue: {
    color: C.text,
    fontWeight: "600",
  },
  free: {
    color: "#15803D",
    fontWeight: "800",
  },
  divider: {
    height: 1,
    backgroundColor: C.border,
    marginVertical: 10,
  },
  totalLabel: {
    fontWeight: "800",
    fontSize: 16,
    color: C.text,
  },
  totalValue: {
    fontWeight: "800",
    fontSize: 21,
    color: C.primary,
  },
  primaryButton: {
    backgroundColor: C.primary,
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
  note: {
    color: C.muted,
    fontSize: 11,
    textAlign: "center",
    marginTop: 12,
  },
});

