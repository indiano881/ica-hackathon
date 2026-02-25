import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import type { CartItem as CartItemType } from "@ica/shared";
import { Colors } from "../theme";

interface Props {
  item: CartItemType;
  compact?: boolean;
  onRemove?: () => void;
  onUpdateQty?: (qty: number) => void;
}

export function CartItem({ item, compact, onRemove, onUpdateQty }: Props) {
  if (compact) {
    return (
      <View style={styles.compactRow}>
        <Text style={styles.compactName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.compactPrice}>
          {item.qty}x {item.unit_price.toFixed(2)}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.row}>
      <View style={styles.info}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.price}>
          {item.unit_price.toFixed(2)} SEK each
        </Text>
      </View>

      <View style={styles.qtyControls}>
        {onUpdateQty && (
          <TouchableOpacity
            style={styles.qtyButton}
            onPress={() => onUpdateQty(Math.max(0, item.qty - 1))}
          >
            <Text style={styles.qtyButtonText}>-</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.qty}>{item.qty}</Text>
        {onUpdateQty && (
          <TouchableOpacity
            style={styles.qtyButton}
            onPress={() => onUpdateQty(item.qty + 1)}
          >
            <Text style={styles.qtyButtonText}>+</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.lineTotal}>{item.line_total.toFixed(2)} SEK</Text>

      {onRemove && (
        <TouchableOpacity onPress={onRemove} style={styles.removeButton}>
          <Text style={styles.removeText}>×</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: "500", color: Colors.text },
  price: { fontSize: 13, color: Colors.textMuted },
  qtyControls: { flexDirection: "row", alignItems: "center", gap: 8 },
  qtyButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.borderLight,
    justifyContent: "center",
    alignItems: "center",
  },
  qtyButtonText: { fontSize: 18, fontWeight: "bold", color: Colors.text },
  qty: { fontSize: 16, fontWeight: "bold", minWidth: 24, textAlign: "center", color: Colors.text },
  lineTotal: { fontSize: 15, fontWeight: "600", marginLeft: 12, minWidth: 80, textAlign: "right", color: Colors.text },
  removeButton: { marginLeft: 8, padding: 4 },
  removeText: { fontSize: 22, color: Colors.primary },
  compactRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  compactName: { flex: 1, fontSize: 14, color: Colors.text },
  compactPrice: { fontSize: 14, color: Colors.textSecondary },
});
