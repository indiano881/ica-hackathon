import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../App";
import { DocKey, type Transaction } from "@ica/shared";
import { getDatabase } from "../db/couchbase";
import { SyncStatusBadge } from "../components/SyncStatusBadge";

type Props = NativeStackScreenProps<RootStackParamList, "Receipt">;

export function ReceiptScreen({ route, navigation }: Props) {
  const { txnId } = route.params;
  const [txn, setTxn] = useState<Transaction | null>(null);

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

  if (!txn) {
    return (
      <View style={styles.container}>
        <Text>Loading receipt...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SyncStatusBadge />

      <View style={styles.header}>
        <Text style={styles.checkmark}>✓</Text>
        <Text style={styles.title}>Payment Complete</Text>
        <Text style={styles.txnRef}>Ref: {txn.txn_id}</Text>
        {txn.offline && (
          <Text style={styles.offlineNote}>
            Paid offline — will sync when connected
          </Text>
        )}
      </View>

      <FlatList
        data={txn.items}
        keyExtractor={(item) => item.ean}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemQty}>x{item.qty}</Text>
            </View>
            <Text style={styles.itemPrice}>{item.line_total.toFixed(2)} SEK</Text>
          </View>
        )}
      />

      <View style={styles.totals}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{txn.totals.total.toFixed(2)} SEK</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.pointsLabel}>Points earned</Text>
          <Text style={styles.pointsValue}>+{txn.points_earned}</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate("Return", { txnId: txn.txn_id })}
        >
          <Text style={styles.buttonText}>Return Items</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={() => navigation.popToTop()}
        >
          <Text style={styles.primaryButtonText}>Done</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: { alignItems: "center", padding: 20 },
  checkmark: { fontSize: 48, color: "#4CAF50" },
  title: { fontSize: 24, fontWeight: "bold", marginTop: 8 },
  txnRef: { fontSize: 12, color: "#999", marginTop: 4 },
  offlineNote: {
    fontSize: 13,
    color: "#FF9800",
    marginTop: 8,
    fontStyle: "italic",
  },
  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  itemInfo: { flexDirection: "row", gap: 8 },
  itemName: { fontSize: 15 },
  itemQty: { fontSize: 15, color: "#999" },
  itemPrice: { fontSize: 15, fontWeight: "600" },
  totals: { padding: 20, borderTopWidth: 1, borderTopColor: "#eee" },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  totalLabel: { fontSize: 18, fontWeight: "bold" },
  totalValue: { fontSize: 18, fontWeight: "bold", color: "#E3000B" },
  pointsLabel: { fontSize: 15, color: "#4CAF50" },
  pointsValue: { fontSize: 15, color: "#4CAF50", fontWeight: "600" },
  actions: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
  },
  button: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  buttonText: { fontSize: 15, color: "#666" },
  primaryButton: {
    backgroundColor: "#E3000B",
    borderColor: "#E3000B",
  },
  primaryButtonText: { fontSize: 15, color: "#fff", fontWeight: "bold" },
});
