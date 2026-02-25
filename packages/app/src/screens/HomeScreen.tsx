import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../App";
import { SyncStatusBadge } from "../components/SyncStatusBadge";
import { PointsDisplay } from "../components/PointsDisplay";
import { useAuth } from "../hooks/useAuth";
import { initDatabase } from "../db/couchbase";
import { startSync } from "../db/sync";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

const DEFAULT_STORE = "store_042";

export function HomeScreen({ navigation }: Props) {
  const { user, login } = useAuth();
  const [loyaltyCard, setLoyaltyCard] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    initDatabase().catch((err) =>
      console.error("Failed to init database:", err)
    );
  }, []);

  const handleLogin = async () => {
    if (!loyaltyCard.trim()) {
      Alert.alert("Error", "Please enter your loyalty card number");
      return;
    }

    setLoading(true);
    try {
      await login(loyaltyCard.trim());
      // Start sync after login
      await startSync(loyaltyCard.trim(), DEFAULT_STORE, loyaltyCard.trim(), "password");
    } catch (err) {
      Alert.alert("Error", "Failed to log in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleStartShopping = () => {
    if (!user) {
      Alert.alert("Error", "Please log in first");
      return;
    }
    navigation.navigate("Scan", {
      userId: user.user_id,
      storeId: DEFAULT_STORE,
    });
  };

  return (
    <View style={styles.container}>
      <SyncStatusBadge />

      <Text style={styles.title}>Welcome to ICA</Text>
      <Text style={styles.subtitle}>Always-On Checkout</Text>

      {!user ? (
        <View style={styles.loginSection}>
          <TextInput
            style={styles.input}
            placeholder="Loyalty card number"
            value={loyaltyCard}
            onChangeText={setLoyaltyCard}
            autoCapitalize="none"
          />
          <TouchableOpacity
            style={styles.button}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? "Logging in..." : "Log In"}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.loggedInSection}>
          <Text style={styles.greeting}>Hello, {user.name}</Text>
          <PointsDisplay points={user.points_balance} tier={user.loyalty_tier} />

          <TouchableOpacity style={styles.button} onPress={handleStartShopping}>
            <Text style={styles.buttonText}>Start Shopping</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#E3000B",
    textAlign: "center",
    marginTop: 40,
  },
  subtitle: {
    fontSize: 18,
    color: "#666",
    textAlign: "center",
    marginBottom: 40,
  },
  loginSection: {
    gap: 16,
  },
  loggedInSection: {
    alignItems: "center",
    gap: 20,
  },
  greeting: {
    fontSize: 22,
    fontWeight: "600",
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#E3000B",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});
