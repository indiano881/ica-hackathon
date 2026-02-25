import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import type { Product } from "@ica/shared";
import { Colors } from "../theme";

interface Props {
  product: Product;
  onAddToCart?: () => void;
}

export function ProductCard({ product, onAddToCart }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.info}>
        <Text style={styles.name}>{product.name}</Text>
        <Text style={styles.brand}>{product.brand}</Text>
        <Text style={styles.price}>{product.price.toFixed(2)} SEK</Text>
        {!product.in_stock && <Text style={styles.outOfStock}>Out of stock</Text>}
      </View>
      {onAddToCart && product.in_stock && (
        <TouchableOpacity style={styles.addButton} onPress={onAddToCart}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: "600", color: Colors.text },
  brand: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },
  price: { fontSize: 15, fontWeight: "bold", color: Colors.primary, marginTop: 4 },
  outOfStock: { fontSize: 12, color: Colors.warning, marginTop: 2 },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  addButtonText: { color: "#fff", fontSize: 24, fontWeight: "bold" },
});
