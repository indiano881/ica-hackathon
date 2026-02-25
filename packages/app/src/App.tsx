import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { HomeScreen } from "./screens/HomeScreen";
import { ScanScreen } from "./screens/ScanScreen";
import { CartScreen } from "./screens/CartScreen";
import { CheckoutScreen } from "./screens/CheckoutScreen";
import { ReceiptScreen } from "./screens/ReceiptScreen";
import { ReturnScreen } from "./screens/ReturnScreen";

export type RootStackParamList = {
  Home: undefined;
  Scan: { userId: string; storeId: string };
  Cart: { cartId: string };
  Checkout: { cartId: string };
  Receipt: { txnId: string };
  Return: { txnId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: { backgroundColor: "#E3000B" },
          headerTintColor: "#fff",
          headerTitleStyle: { fontWeight: "bold" },
        }}
      >
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: "ICA Checkout" }}
        />
        <Stack.Screen
          name="Scan"
          component={ScanScreen}
          options={{ title: "Scan Products" }}
        />
        <Stack.Screen
          name="Cart"
          component={CartScreen}
          options={{ title: "Your Cart" }}
        />
        <Stack.Screen
          name="Checkout"
          component={CheckoutScreen}
          options={{ title: "Checkout" }}
        />
        <Stack.Screen
          name="Receipt"
          component={ReceiptScreen}
          options={{ title: "Receipt" }}
        />
        <Stack.Screen
          name="Return"
          component={ReturnScreen}
          options={{ title: "Return Items" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
