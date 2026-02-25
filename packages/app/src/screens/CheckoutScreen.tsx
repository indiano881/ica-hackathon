import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../App";
import { useCart } from "../hooks/useCart";
import { useAuth } from "../hooks/useAuth";
import { SyncStatusBadge } from "../components/SyncStatusBadge";
import {
  generateId,
  DocKey,
  nowISO,
  pointsFromTotal,
  type Transaction,
  type PointsDelta,
} from "@ica/shared";
import { MutableDocument } from "cbl-reactnative";
import { getDatabase } from "../db/couchbase";
import { isConnected } from "../utils/connectivity";
import { Colors, Spacing, Radius } from "../theme";

type Props = NativeStackScreenProps<RootStackParamList, "Checkout">;

export function CheckoutScreen({ route, navigation }: Props) {
  const { cartId } = route.params;
  const { cart, setCartStatus } = useCart();
  const { user } = useAuth();
  const [processing, setProcessing] = useState(false);

  const handlePay = async () => {
    if (!cart || !user) return;
    setProcessing(true);

    try {
      const db = getDatabase();
      const collection = await db.defaultCollection();
      const offline = !(await isConnected());

      const hasPreauth =
        user.payment_preauth &&
        new Date(user.payment_preauth.expires_at) > new Date() &&
        user.payment_preauth.ceiling_sek >= cart.totals.total;

      const method = hasPreauth ? "preauth" : "loyalty";

      const txnId = generateId("txn");
      const txn: Transaction = {
        type: "transaction",
        txn_id: txnId,
        cart_id: cart.cart_id,
        user_id: user.user_id,
        store_id: cart.store_id,
        device_id: "device_local",
        items: cart.items,
        totals: {
          subtotal: cart.totals.subtotal,
          vat_total: cart.totals.vat_total,
          total: cart.totals.total,
        },
        payment: {
          method,
          preauth_token: hasPreauth ? user.payment_preauth!.token : null,
          amount: cart.totals.total,
          status: "pending_capture",
          settled_at: null,
        },
        points_earned: pointsFromTotal(cart.totals.total),
        offline,
        created_at: nowISO(),
        synced_at: null,
      };

      const txnKey = DocKey.transaction(txnId);
      const txnDoc = new MutableDocument(txnKey);
      txnDoc.setData(txn as unknown as Record<string, unknown>);
      await collection.save(txnDoc);

      const deltaId = generateId("pd");
      const pointsDelta: PointsDelta = {
        type: "points_delta",
        delta_id: deltaId,
        user_id: user.user_id,
        txn_id: txnId,
        delta: txn.points_earned,
        reason: "purchase",
        store_id: cart.store_id,
        status: "pending",
        created_at: nowISO(),
      };
      const deltaKey = DocKey.pointsDelta(deltaId);
      const deltaDoc = new MutableDocument(deltaKey);
      deltaDoc.setData(pointsDelta as unknown as Record<string, unknown>);
      await collection.save(deltaDoc);

      await setCartStatus("checked_out");

      navigation.replace("Receipt", { txnId });
    } catch (err) {
      Alert.alert("Payment Failed", "Something went wrong. Please try again.");
      console.error("Checkout error:", err);
    } finally {
      setProcessing(false);
    }
  };

  if (!cart || !user) {
    return (
      <View style={styles.container}>
        <Text style={{ color: Colors.text }}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SyncStatusBadge />

      <View style={styles.summaryCard}>
        <Text style={styles.title}>Order Summary</Text>
        <Text style={styles.itemCount}>{cart.totals.items_count} items</Text>
        <Text style={styles.total}>{cart.totals.total.toFixed(2)} SEK</Text>
        <Text style={styles.points}>
          You'll earn {pointsFromTotal(cart.totals.total)} points
        </Text>
      </View>

      <View style={styles.paymentCard}>
        <Text style={styles.paymentTitle}>Payment Method</Text>
        {user.payment_preauth &&
        new Date(user.payment_preauth.expires_at) > new Date() ? (
          <Text style={styles.paymentMethod}>
            Pre-authorized card (up to {user.payment_preauth.ceiling_sek} SEK)
          </Text>
        ) : (
          <Text style={styles.paymentMethod}>Loyalty points balance</Text>
        )}
      </View>

      <TouchableOpacity
        style={[styles.payButton, processing && styles.disabledButton]}
        onPress={handlePay}
        disabled={processing}
      >
        <Text style={styles.payButtonText}>
          {processing ? "Processing..." : `Pay ${cart.totals.total.toFixed(2)} SEK`}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: Spacing.lg },
  summaryCard: {
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: Radius.sm,
    padding: Spacing.lg,
    marginVertical: Spacing.md,
  },
  title: { fontSize: 24, fontWeight: "bold", color: Colors.text, marginBottom: Spacing.sm },
  itemCount: { fontSize: 16, color: Colors.textSecondary, marginBottom: Spacing.xs },
  total: { fontSize: 36, fontWeight: "bold", color: Colors.primary },
  points: { fontSize: 14, color: Colors.success, marginTop: Spacing.sm },
  paymentCard: {
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: Radius.sm,
    marginBottom: Spacing.xl,
  },
  paymentTitle: { fontSize: 14, color: Colors.textSecondary, marginBottom: Spacing.xs },
  paymentMethod: { fontSize: 16, fontWeight: "600", color: Colors.text },
  payButton: {
    backgroundColor: Colors.success,
    padding: 18,
    borderRadius: Radius.sm,
    alignItems: "center",
  },
  disabledButton: { backgroundColor: Colors.disabled },
  payButtonText: { color: "#fff", fontSize: 20, fontWeight: "bold" },
});
