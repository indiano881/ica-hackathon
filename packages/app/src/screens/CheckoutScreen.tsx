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

      // Determine payment method
      const hasPreauth =
        user.payment_preauth &&
        new Date(user.payment_preauth.expires_at) > new Date() &&
        user.payment_preauth.ceiling_sek >= cart.totals.total;

      const method = hasPreauth ? "preauth" : "loyalty";

      // Create transaction document
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

      // Save transaction to Couchbase Lite
      const txnKey = DocKey.transaction(txnId);
      const txnDoc = new MutableDocument(txnKey);
      txnDoc.setData(txn as unknown as Record<string, unknown>);
      await collection.save(txnDoc);

      // Create points delta (append-only)
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

      // Mark cart as checked out
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
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SyncStatusBadge />

      <View style={styles.summary}>
        <Text style={styles.title}>Order Summary</Text>
        <Text style={styles.itemCount}>{cart.totals.items_count} items</Text>
        <Text style={styles.total}>{cart.totals.total.toFixed(2)} SEK</Text>
        <Text style={styles.points}>
          You'll earn {pointsFromTotal(cart.totals.total)} points
        </Text>
      </View>

      <View style={styles.paymentInfo}>
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
  container: { flex: 1, backgroundColor: "#fff", padding: 20 },
  summary: { alignItems: "center", marginVertical: 30 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 8 },
  itemCount: { fontSize: 16, color: "#666", marginBottom: 4 },
  total: { fontSize: 36, fontWeight: "bold", color: "#E3000B" },
  points: { fontSize: 14, color: "#4CAF50", marginTop: 8 },
  paymentInfo: {
    backgroundColor: "#f9f9f9",
    padding: 16,
    borderRadius: 8,
    marginBottom: 30,
  },
  paymentTitle: { fontSize: 14, color: "#666", marginBottom: 4 },
  paymentMethod: { fontSize: 16, fontWeight: "600" },
  payButton: {
    backgroundColor: "#4CAF50",
    padding: 18,
    borderRadius: 8,
    alignItems: "center",
  },
  disabledButton: { backgroundColor: "#ccc" },
  payButtonText: { color: "#fff", fontSize: 20, fontWeight: "bold" },
});
