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
import { Colors, Spacing, Radius } from "../theme";

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
  container: { flex: 1, backgroundColor: Colors.surface },
  emptyText: {
    textAlign: "center",
    color: Colors.textMuted,
    fontSize: 16,
    marginTop: Spacing.xxl,
  },
  totals: {
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.xs,
  },
  totalLabel: { fontSize: 15, color: Colors.textSecondary },
  totalValue: { fontSize: 15, color: Colors.text },
  grandTotal: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  grandTotalLabel: { fontSize: 18, fontWeight: "bold", color: Colors.text },
  grandTotalValue: { fontSize: 18, fontWeight: "bold", color: Colors.primary },
  checkoutButton: {
    backgroundColor: Colors.primary,
    margin: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.sm,
    alignItems: "center",
  },
  disabledButton: { backgroundColor: Colors.disabled },
  checkoutButtonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
});
