import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { theme } from "../../constants/theme";
import { supabase } from "../../lib/supabase";

type HistoryItem = {
  id: string;
  reward_type: string;
  quantity: number;
  redeemed_at: string;
};

export default function ProfileScreen() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [lifetimeTotal, setLifetimeTotal] = useState(0);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [rewardStats, setRewardStats] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);

  // ----------------------------------------------------------
  // ✅ Use useFocusEffect to refresh every time tab is opened
  // ----------------------------------------------------------
  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const loadProfile = async () => {
        setLoading(true);
        setError(null);

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user || !isActive) {
          setError("Not logged in.");
          setLoading(false);
          return;
        }

        try {
          // 1️⃣ Lifetime total from drink_counters
          const { data: counterData } = await supabase
            .from("drink_counters")
            .select("total_drinks_earned")
            .eq("user_id", user.id)
            .maybeSingle();

          if (isActive)
            setLifetimeTotal(counterData?.total_drinks_earned ?? 0);

          // 2️⃣ Session history
          const { data: historyRows } = await supabase
            .from("drinks_history")
            .select("*")
            .eq("user_id", user.id)
            .order("redeemed_at", { ascending: false });

          if (isActive) setHistory(historyRows || []);

          // 3️⃣ Reward totals (count each type)
          const stats: Record<string, number> = {};
          historyRows?.forEach((row) => {
            stats[row.reward_type] = (stats[row.reward_type] || 0) + row.quantity;
          });

          if (isActive) setRewardStats(stats);
        } catch (err) {
          console.log("Profile load error:", err);
          if (isActive) setError("Failed to load profile data.");
        } finally {
          if (isActive) setLoading(false);
        }
      };

      // Load once when screen is focused
      loadProfile();

      return () => {
        isActive = false;
      };
    }, [])
  );

  // ----------------------------------------------------------
  // LOGOUT
  // ----------------------------------------------------------
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/auth");
  };

  // ----------------------------------------------------------
  // LOADING STATE
  // ----------------------------------------------------------
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.neonGold} />
      </View>
    );
  }

  // ----------------------------------------------------------
  // UI RENDER
  // ----------------------------------------------------------
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 60 }}>
      <Text style={styles.header}>Profile</Text>

      {/* --- Lifetime Stats --- */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Lifetime Rewards</Text>

        <View style={styles.lifetimeRow}>
          <Ionicons
            name="trophy"
            size={26}
            color={theme.colors.neonGold}
            style={{ marginRight: 10 }}
          />
          <Text style={styles.lifetimeNumber}>{lifetimeTotal}</Text>
        </View>

        <Text style={styles.cardSubtitle}>Total rewards earned</Text>
      </View>

      {/* --- Reward Breakdown --- */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Reward Stats</Text>

        {Object.keys(rewardStats).length === 0 ? (
          <Text style={styles.emptyText}>No rewards earned yet.</Text>
        ) : (
          Object.entries(rewardStats).map(([reward, count]) => (
            <View style={styles.rewardRow} key={reward}>
              <Text style={styles.rewardName}>{reward}</Text>
              <Text style={styles.rewardCount}>{count}</Text>
            </View>
          ))
        )}
      </View>

      {/* --- Session History --- */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Session History</Text>

        {history.length === 0 ? (
          <Text style={styles.emptyText}>No sessions completed yet.</Text>
        ) : (
          history.map((entry) => (
            <View style={styles.historyRow} key={entry.id}>
              <View>
                <Text style={styles.historyReward}>{entry.reward_type}</Text>
                <Text style={styles.historyDate}>
                  {new Date(entry.redeemed_at).toLocaleString()}
                </Text>
              </View>

              <View style={styles.quantityBadge}>
                <Text style={styles.quantityText}>+{entry.quantity}</Text>
              </View>
            </View>
          ))
        )}
      </View>

      {/* --- LOGOUT BUTTON --- */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons
          name="log-out-outline"
          size={20}
          color="#000"
          style={{ marginRight: 8 }}
        />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      {error && <Text style={styles.error}>{error}</Text>}
    </ScrollView>
  );
}

/* ----------------------------- STYLES ----------------------------- */

const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingHorizontal: 24,
    paddingTop: 50,
  },

  header: {
    fontSize: 34,
    fontWeight: "800",
    color: theme.colors.textPrimary,
    marginBottom: 20,
  },

  /* Cards */
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: theme.colors.textPrimary,
    marginBottom: 14,
  },
  cardSubtitle: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },

  /* Lifetime Section */
  lifetimeRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  lifetimeNumber: {
    fontSize: 32,
    fontWeight: "800",
    color: theme.colors.neonGold,
  },

  /* Reward Breakdown */
  rewardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  rewardName: {
    fontSize: 16,
    color: theme.colors.textPrimary,
  },
  rewardCount: {
    fontSize: 16,
    color: theme.colors.neonGold,
    fontWeight: "700",
  },

  /* History */
  historyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  historyReward: {
    fontSize: 15,
    fontWeight: "600",
    color: theme.colors.textPrimary,
  },
  historyDate: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  quantityBadge: {
    backgroundColor: "rgba(255,215,0,0.15)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  quantityText: {
    color: theme.colors.neonGold,
    fontWeight: "700",
  },

  /* Logout */
  logoutBtn: {
    flexDirection: "row",
    alignSelf: "center",
    backgroundColor: theme.colors.neonGold,
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 30,
    marginTop: 20,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000",
  },

  /* Error */
  emptyText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    paddingVertical: 6,
  },
  error: {
    textAlign: "center",
    color: theme.colors.error,
    marginTop: 16,
  },
});