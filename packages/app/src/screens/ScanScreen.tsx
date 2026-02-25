import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  FlatList,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../App";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useCart } from "../hooks/useCart";
import { useProducts } from "../hooks/useProducts";
import { CartItem } from "../components/CartItem";
import { SyncStatusBadge } from "../components/SyncStatusBadge";
import { Colors, Spacing, Radius } from "../theme";

type Props = NativeStackScreenProps<RootStackParamList, "Scan">;

export function ScanScreen({ route, navigation }: Props) {
  const { userId, storeId } = route.params;
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(true);
  const { cart, addItem, initCart } = useCart();
  const { getProduct } = useProducts(storeId);

  useEffect(() => {
    initCart(userId, storeId);
  }, [userId, storeId, initCart]);

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission]);

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (!scanning) return;
    setScanning(false);

    const product = await getProduct(data);
    if (!product) {
      Alert.alert("Not Found", `Product with EAN ${data} not found.`, [
        { text: "OK", onPress: () => setScanning(true) },
      ]);
      return;
    }

    await addItem(product);
    setScanning(true);
  };

  const handleGoToCart = () => {
    if (!cart) return;
    navigation.navigate("Cart", { cartId: cart.cart_id });
  };

  if (!permission?.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Camera permission is required to scan barcodes.</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SyncStatusBadge />

      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          barcodeScannerSettings={{ barcodeTypes: ["ean13", "ean8"] }}
          onBarcodeScanned={scanning ? handleBarCodeScanned : undefined}
        />
        <View style={styles.overlay}>
          <Text style={styles.scanText}>
            {scanning ? "Point at barcode" : "Processing..."}
          </Text>
        </View>
      </View>

      {cart && cart.items.length > 0 && (
        <View style={styles.cartPreview}>
          <Text style={styles.cartTitle}>
            Cart ({cart.totals.items_count} items) — {cart.totals.total.toFixed(2)} SEK
          </Text>
          <FlatList
            data={cart.items.slice(-3)}
            keyExtractor={(item) => `${item.ean}-${item.scanned_at}`}
            renderItem={({ item }) => <CartItem item={item} compact />}
          />
          <TouchableOpacity style={styles.button} onPress={handleGoToCart}>
            <Text style={styles.buttonText}>View Cart</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  cameraContainer: { flex: 1, position: "relative" },
  camera: { flex: 1 },
  overlay: {
    position: "absolute",
    bottom: Spacing.lg,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  scanText: {
    color: "#fff",
    fontSize: 18,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    borderRadius: Radius.sm,
  },
  message: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
    padding: Spacing.lg,
    marginTop: Spacing.xxl,
  },
  cartPreview: {
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    maxHeight: 250,
  },
  cartTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  button: {
    backgroundColor: Colors.primary,
    padding: 14,
    borderRadius: Radius.sm,
    alignItems: "center",
    marginTop: Spacing.sm,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});
