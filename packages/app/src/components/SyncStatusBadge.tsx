import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useSync } from "../hooks/useSync";

const STATUS_CONFIG = {
  idle: { label: "Online", color: "#4CAF50" },
  connecting: { label: "Connecting...", color: "#FF9800" },
  syncing: { label: "Syncing...", color: "#2196F3" },
  stopped: { label: "Offline", color: "#999" },
  error: { label: "Sync Error", color: "#F44336" },
} as const;

export function SyncStatusBadge() {
  const { status } = useSync();
  const config = STATUS_CONFIG[status];

  return (
    <View style={[styles.badge, { backgroundColor: config.color }]}>
      <Text style={styles.text}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "center",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  text: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
});
