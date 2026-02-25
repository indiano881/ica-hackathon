import React from "react";
import { View, Text, StyleSheet } from "react-native";
import type { LoyaltyTier } from "@ica/shared";

interface Props {
  points: number;
  tier: LoyaltyTier;
}

const TIER_COLORS: Record<LoyaltyTier, string> = {
  bronze: "#CD7F32",
  silver: "#C0C0C0",
  gold: "#FFD700",
  platinum: "#E5E4E2",
};

export function PointsDisplay({ points, tier }: Props) {
  return (
    <View style={styles.container}>
      <View style={[styles.tierBadge, { backgroundColor: TIER_COLORS[tier] }]}>
        <Text style={styles.tierText}>{tier.toUpperCase()}</Text>
      </View>
      <Text style={styles.points}>{points.toLocaleString()} points</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: 8,
  },
  tierBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tierText: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#333",
  },
  points: {
    fontSize: 16,
    color: "#666",
  },
});
