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
import { Colors, Spacing, Radius } from "../theme";

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
        <Text style={{ color: Colors.text }}>Loading receipt...</Text>
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
          style={styles.secondaryButton}
          onPress={() => navigation.navigate("Return", { txnId: txn.txn_id })}
        >
          <Text style={styles.secondaryButtonText}>Return Items</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.popToTop()}
        >
          <Text style={styles.primaryButtonText}>Done</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  header: { alignItems: "center", padding: Spacing.lg },
  checkmark: { fontSize: 48, color: Colors.success },
  title: { fontSize: 24, fontWeight: "bold", color: Colors.text, marginTop: Spacing.sm },
  txnRef: { fontSize: 12, color: Colors.textMuted, marginTop: Spacing.xs },
  offlineNote: {
    fontSize: 13,
    color: Colors.warning,
    marginTop: Spacing.sm,
    fontStyle: "italic",
  },
  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  itemInfo: { flexDirection: "row", gap: Spacing.sm },
  itemName: { fontSize: 15, color: Colors.text },
  itemQty: { fontSize: 15, color: Colors.textMuted },
  itemPrice: { fontSize: 15, fontWeight: "600", color: Colors.text },
  totals: { padding: Spacing.lg, borderTopWidth: 1, borderTopColor: Colors.border },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.xs,
  },
  totalLabel: { fontSize: 18, fontWeight: "bold", color: Colors.text },
  totalValue: { fontSize: 18, fontWeight: "bold", color: Colors.primary },
  pointsLabel: { fontSize: 15, color: Colors.success },
  pointsValue: { fontSize: 15, color: Colors.success, fontWeight: "600" },
  actions: {
    flexDirection: "row",
    padding: Spacing.md,
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    padding: 14,
    borderRadius: Radius.sm,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  secondaryButtonText: { fontSize: 15, color: Colors.textSecondary },
  primaryButton: {
    flex: 1,
    padding: 14,
    borderRadius: Radius.sm,
    alignItems: "center",
    backgroundColor: Colors.primary,
  },
  primaryButtonText: { fontSize: 15, color: "#fff", fontWeight: "bold" },
});
