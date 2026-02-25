import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../App";
import {
  DocKey,
  generateId,
  nowISO,
  type Transaction,
  type ReturnRequest,
  type ReturnItem,
} from "@ica/shared";
import { MutableDocument } from "cbl-reactnative";
import { getDatabase } from "../db/couchbase";
import { isConnected } from "../utils/connectivity";
import { SyncStatusBadge } from "../components/SyncStatusBadge";
import { Colors, Spacing, Radius } from "../theme";

type Props = NativeStackScreenProps<RootStackParamList, "Return">;

export function ReturnScreen({ route, navigation }: Props) {
  const { txnId } = route.params;
  const [txn, setTxn] = useState<Transaction | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadTransaction();
  }, [txnId]);

  const loadTransaction = async () => {
    try {
      const db = getDatabase();
      const collection = await db.defaultCollection();
      const key = DocKey.transaction(txnId);
      const doc = await collection.getDocument(key);
      if (doc) {
        setTxn(doc.getData() as unknown as Transaction);
      }
    } catch (err) {
      console.error("Failed to load transaction:", err);
    }
  };

  const toggleItem = (ean: string) => {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(ean)) next.delete(ean);
      else next.add(ean);
      return next;
    });
  };

  const handleSubmitReturn = async () => {
    if (!txn || selectedItems.size === 0) return;
    setSubmitting(true);

    try {
      const db = getDatabase();
      const collection = await db.defaultCollection();
      const offline = !(await isConnected());

      const returnItems: ReturnItem[] = txn.items
        .filter((item) => selectedItems.has(item.ean))
        .map((item) => ({
          ean: item.ean,
          qty: item.qty,
          unit_price: item.unit_price,
          reason: "customer_request",
        }));

      const refundAmount = returnItems.reduce(
        (sum, item) => sum + item.unit_price * item.qty,
        0
      );

      const returnId = generateId("ret");
      const returnReq: ReturnRequest = {
        type: "return_request",
        return_id: returnId,
        user_id: txn.user_id,
        store_id: txn.store_id,
        original_txn_id: txn.txn_id,
        items: returnItems,
        refund: {
          amount: Math.round(refundAmount * 100) / 100,
          method: offline ? "loyalty_credit" : "card_refund",
          status: "pending",
        },
        points_delta: -Math.floor(refundAmount),
        offline,
        created_at: nowISO(),
      };

      const key = DocKey.returnRequest(returnId);
      const doc = new MutableDocument(key);
      doc.setData(returnReq as unknown as Record<string, unknown>);
      await collection.save(doc);

      Alert.alert(
        "Return Submitted",
        offline
          ? "Your return will be processed when connectivity is restored. Points will be adjusted."
          : "Your return has been submitted for processing.",
        [{ text: "OK", onPress: () => navigation.popToTop() }]
      );
    } catch (err) {
      Alert.alert("Error", "Failed to submit return. Please try again.");
      console.error("Return error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  if (!txn) {
    return (
      <View style={styles.container}>
        <Text style={{ color: Colors.text }}>Loading transaction...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SyncStatusBadge />

      <Text style={styles.title}>Select items to return</Text>
      <Text style={styles.subtitle}>From order {txn.txn_id}</Text>

      <FlatList
        data={txn.items}
        keyExtractor={(item) => item.ean}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.item,
              selectedItems.has(item.ean) && styles.itemSelected,
            ]}
            onPress={() => toggleItem(item.ean)}
          >
            <View>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemDetail}>
                {item.qty}x {item.unit_price.toFixed(2)} SEK
              </Text>
            </View>
            {selectedItems.has(item.ean) && (
              <Text style={styles.selectedCheck}>✓</Text>
            )}
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity
        style={[
          styles.submitButton,
          (selectedItems.size === 0 || submitting) && styles.disabledButton,
        ]}
        onPress={handleSubmitReturn}
        disabled={selectedItems.size === 0 || submitting}
      >
        <Text style={styles.submitButtonText}>
          {submitting
            ? "Submitting..."
            : `Return ${selectedItems.size} item(s)`}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface, padding: Spacing.md },
  title: { fontSize: 20, fontWeight: "bold", color: Colors.text, marginBottom: Spacing.xs },
  subtitle: { fontSize: 14, color: Colors.textMuted, marginBottom: Spacing.md },
  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    marginBottom: Spacing.sm,
  },
  itemSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.lightRosa,
  },
  itemName: { fontSize: 16, fontWeight: "500", color: Colors.text },
  itemDetail: { fontSize: 14, color: Colors.textSecondary, marginTop: 2 },
  selectedCheck: { fontSize: 20, color: Colors.primary, fontWeight: "bold" },
  submitButton: {
    backgroundColor: Colors.primary,
    padding: Spacing.md,
    borderRadius: Radius.sm,
    alignItems: "center",
    marginTop: Spacing.md,
  },
  disabledButton: { backgroundColor: Colors.disabled },
  submitButtonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
});
