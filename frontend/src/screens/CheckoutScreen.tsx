
import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  Pressable,
  View,
} from "react-native";

export type CheckoutItem = {
  id: string;
  name: string;
  price: number;
  icon: string;
  quantity: number;
};

type Props = {
  items: CheckoutItem[];
  onBack: () => void;
  onPlaceOrder: () => void;
};

const C = {
  primary: "#2563EB",
  background: "#F5F7FB",
  surface: "#FFFFFF",
  text: "#111827",
  muted: "#64748B",
  border: "#E2E8F0",
  success: "#15803D",
};

const money = (amount: number) =>
  `₹${amount.toLocaleString("en-IN")}`;

export default function CheckoutScreen({
  items,
  onBack,
  onPlaceOrder,
}: Props) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [pinCode, setPinCode] = useState("");
  const [payment, setPayment] = useState<"COD" | "UPI">("COD");

  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const deliveryFee = subtotal >= 1000 || subtotal === 0 ? 0 : 49;
  const total = subtotal + deliveryFee;

  const handlePlaceOrder = () => {
    if (items.length === 0) {
      Alert.alert("Empty cart", "Add a product before checking out.");
      return;
    }

    if (
      !name.trim() ||
      !phone.trim() ||
      !address.trim() ||
      !city.trim() ||
      !pinCode.trim()
    ) {
      Alert.alert("Missing details", "Please fill in all delivery fields.");
      return;
    }

    if (!/^[6-9]\d{9}$/.test(phone.trim())) {
      Alert.alert(
        "Invalid phone number",
        "Enter a valid 10-digit Indian mobile number."
      );
      return;
    }

    if (!/^\d{6}$/.test(pinCode.trim())) {
      Alert.alert("Invalid PIN code", "Enter a 6-digit PIN code.");
      return;
    }

    if (payment === "UPI") {
      Alert.alert(
        "UPI not connected yet",
        "Online payment will be enabled when a payment provider is integrated."
      );
      return;
    }

    Alert.alert(
      "Confirm order",
      `Place your order for ${money(total)} with Cash on Delivery?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Place order",
          onPress: onPlaceOrder,
        },
      ]
    );
  };

  const renderInput = (
    label: string,
    value: string,
    setter: (value: string) => void,
    placeholder: string,
    keyboardType: "default" | "phone-pad" | "number-pad" = "default",
    multiline = false
  ) => (
    <View style={styles.field} key={label}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={setter}
        placeholder={placeholder}
        placeholderTextColor={C.muted}
        keyboardType={keyboardType}
        multiline={multiline}
        style={[
          styles.input,
          multiline && styles.multilineInput,
        ]}
      />
    </View>
  );

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Pressable onPress={onBack} style={styles.backButton}>
        <Text style={styles.backText}>‹  Back to cart</Text>
      </Pressable>

      <Text style={styles.title}>Checkout</Text>
      <Text style={styles.subtitle}>
        Almost there! Complete your order details.
      </Text>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Delivery address</Text>

        {renderInput("Full name", name, setName, "Enter your full name")}
        {renderInput(
          "Mobile number",
          phone,
          setPhone,
          "10-digit mobile number",
          "phone-pad"
        )}
        {renderInput(
          "House / Street address",
          address,
          setAddress,
          "Flat, building, street, area",
          "default",
          true
        )}
        {renderInput("City", city, setCity, "Enter your city")}
        {renderInput(
          "PIN code",
          pinCode,
          setPinCode,
          "6-digit PIN code",
          "number-pad"
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Payment method</Text>

        <Pressable
          onPress={() => setPayment("COD")}
          style={[
            styles.paymentOption,
            payment === "COD" && styles.paymentSelected,
          ]}
        >
          <Text style={styles.paymentIcon}>💵</Text>
          <View style={styles.paymentInfo}>
            <Text style={styles.paymentTitle}>Cash on Delivery</Text>
            <Text style={styles.paymentDescription}>
              Pay when your order arrives
            </Text>
          </View>
          <Text style={styles.radio}>
            {payment === "COD" ? "🔵" : "⚪"}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setPayment("UPI")}
          style={[
            styles.paymentOption,
            payment === "UPI" && styles.paymentSelected,
          ]}
        >
          <Text style={styles.paymentIcon}>📱</Text>
          <View style={styles.paymentInfo}>
            <Text style={styles.paymentTitle}>UPI</Text>
            <Text style={styles.paymentDescription}>
              Online payment integration pending
            </Text>
          </View>
          <Text style={styles.radio}>
            {payment === "UPI" ? "🔵" : "⚪"}
          </Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Order summary</Text>

        {items.map((item) => (
          <View key={item.id} style={styles.itemRow}>
            <Text style={styles.itemIcon}>{item.icon}</Text>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemQuantity}>
                Qty: {item.quantity}
              </Text>
            </View>
            <Text style={styles.itemPrice}>
              {money(item.price * item.quantity)}
            </Text>
          </View>
        ))}

        <View style={styles.divider} />

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Subtotal</Text>
          <Text style={styles.summaryValue}>{money(subtotal)}</Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Delivery</Text>
          <Text
            style={[
              styles.summaryValue,
              deliveryFee === 0 && styles.freeDelivery,
            ]}
          >
            {deliveryFee === 0 ? "FREE" : money(deliveryFee)}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.summaryRow}>
          <Text style={styles.totalLabel}>Total amount</Text>
          <Text style={styles.totalValue}>{money(total)}</Text>
        </View>
      </View>

      <Pressable
        onPress={handlePlaceOrder}
        style={({ pressed }) => [
          styles.placeOrderButton,
          pressed && styles.buttonPressed,
        ]}
      >
        <Text style={styles.placeOrderText}>
          Place Order · {money(total)}
        </Text>
      </Pressable>

      <Text style={styles.footer}>
        Your order will be confirmed after you submit it.
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
    padding: 20,
    paddingBottom: 40,
  },
  backButton: {
    alignSelf: "flex-start",
    paddingVertical: 8,
    marginBottom: 12,
  },
  backText: {
    color: C.primary,
    fontSize: 16,
    fontWeight: "600",
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: C.text,
  },
  subtitle: {
    color: C.muted,
    fontSize: 14,
    marginTop: 6,
    marginBottom: 22,
  },
  card: {
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: C.border,
  },
  sectionTitle: {
    color: C.text,
    fontSize: 19,
    fontWeight: "700",
    marginBottom: 16,
  },
  field: {
    marginBottom: 14,
  },
  label: {
    color: C.text,
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 7,
  },
  input: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    color: C.text,
    backgroundColor: "#FFFFFF",
  },
  multilineInput: {
    minHeight: 85,
    textAlignVertical: "top",
  },
  paymentOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    marginBottom: 10,
  },
  paymentSelected: {
    borderColor: C.primary,
    backgroundColor: "#EFF6FF",
  },
  paymentIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: C.text,
  },
  paymentDescription: {
    fontSize: 12,
    color: C.muted,
    marginTop: 4,
  },
  radio: {
    fontSize: 17,
    marginLeft: 8,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  itemIcon: {
    fontSize: 27,
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    color: C.text,
    fontSize: 14,
    fontWeight: "600",
  },
  itemQuantity: {
    color: C.muted,
    fontSize: 12,
    marginTop: 4,
  },
  itemPrice: {
    color: C.text,
    fontWeight: "600",
    marginLeft: 8,
  },
  divider: {
    height: 1,
    backgroundColor: C.border,
    marginVertical: 13,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 7,
  },
  summaryLabel: {
    color: C.muted,
    fontSize: 14,
  },
  summaryValue: {
    color: C.text,
    fontSize: 14,
    fontWeight: "500",
  },
  freeDelivery: {
    color: C.success,
    fontWeight: "700",
  },
  totalLabel: {
    color: C.text,
    fontSize: 16,
    fontWeight: "700",
  },
  totalValue: {
    color: C.primary,
    fontSize: 21,
    fontWeight: "800",
  },
  placeOrderButton: {
    backgroundColor: C.primary,
    borderRadius: 13,
    padding: 17,
    alignItems: "center",
  },
  buttonPressed: {
    opacity: 0.8,
  },
  placeOrderText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  footer: {
    textAlign: "center",
    color: C.muted,
    fontSize: 12,
    marginTop: 14,
  },
});
