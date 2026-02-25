import React from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../App";
import { useCart } from "../hooks/useCart";
import { CartItem } from "../components/CartItem";
import { SyncStatusBadge } from "../components/SyncStatusBadge";

type Props = NativeStackScreenProps<RootStackParamList, "Cart">;

export function CartScreen({ route, navigation }: Props) {
  const { cartId } = route.params;
  const { cart, removeItem, updateItemQty } = useCart();

  if (!cart) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>Cart not found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SyncStatusBadge />

      <FlatList
        data={cart.items}
        keyExtractor={(item) => item.ean}
        renderItem={({ item }) => (
          <CartItem
            item={item}
            onRemove={() => removeItem(item.ean)}
            onUpdateQty={(qty) => updateItemQty(item.ean, qty)}
          />
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Your cart is empty.</Text>
        }
      />

      <View style={styles.totals}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Subtotal</Text>
          <Text style={styles.totalValue}>
            {cart.totals.subtotal.toFixed(2)} SEK
          </Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>VAT</Text>
          <Text style={styles.totalValue}>
            {cart.totals.vat_total.toFixed(2)} SEK
          </Text>
        </View>
        <View style={[styles.totalRow, styles.grandTotal]}>
          <Text style={styles.grandTotalLabel}>Total</Text>
          <Text style={styles.grandTotalValue}>
            {cart.totals.total.toFixed(2)} SEK
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={[
          styles.checkoutButton,
          cart.items.length === 0 && styles.disabledButton,
        ]}
        onPress={() => navigation.navigate("Checkout", { cartId: cart.cart_id })}
        disabled={cart.items.length === 0}
      >
        <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  emptyText: {
    textAlign: "center",
    color: "#999",
    fontSize: 16,
    marginTop: 40,
  },
  totals: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  totalLabel: { fontSize: 15, color: "#666" },
  totalValue: { fontSize: 15, color: "#333" },
  grandTotal: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#ddd",
  },
  grandTotalLabel: { fontSize: 18, fontWeight: "bold" },
  grandTotalValue: { fontSize: 18, fontWeight: "bold", color: "#E3000B" },
  checkoutButton: {
    backgroundColor: "#E3000B",
    margin: 16,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  disabledButton: { backgroundColor: "#ccc" },
  checkoutButtonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
});
