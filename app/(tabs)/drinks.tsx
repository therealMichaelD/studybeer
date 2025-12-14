// app/(tabs)/drinks.tsx
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { RewardId } from "../../components/AnimatedReward";
import { theme } from "../../constants/theme";
import { supabase } from "../../lib/supabase";

type RewardItem = {
  id: RewardId;
  label: string;
  emoji: string;
  description: string;
};

// 📂 ORGANIZED DATA SECTIONS
const SECTIONS: { title: string; data: RewardItem[] }[] = [
  {
    title: "Alcoholic",
    data: [
      { id: "beer", label: "Beer", emoji: "🍺", description: "Classic pint." },
      { id: "wine", label: "Wine", emoji: "🍷", description: "Classy glass." },
      { id: "martini", label: "Martini", emoji: "🍸", description: "Shaken, not stirred." },
      { id: "whiskey", label: "Whiskey", emoji: "🥃", description: "On the rocks." },
      { id: "cocktail", label: "Cocktail", emoji: "🍹", description: "Fruity mix." },
      { id: "sake", label: "Sake", emoji: "🍶", description: "Warm or cold." },
    ],
  },
  {
    title: "Non-Alcoholic",
    data: [
      { id: "coffee", label: "Coffee", emoji: "☕", description: "Caffeine fix." },
      { id: "boba", label: "Boba", emoji: "🧋", description: "Chewy pearls." },
      { id: "soda", label: "Soda", emoji: "🥤", description: "Fizzy pop." },
      { id: "pizza", label: "Pizza", emoji: "🍕", description: "Cheesy slice." },
      { id: "burger", label: "Burger", emoji: "🍔", description: "Juicy bite." },
      { id: "sushi", label: "Sushi", emoji: "🍣", description: "Fresh roll." },
      { id: "tacos", label: "Tacos", emoji: "🌮", description: "Crunch time." },
      { id: "icecream", label: "Ice Cream", emoji: "🍨", description: "Sweet treat." },
      { id: "chocolate", label: "Chocolate", emoji: "🍫", description: "Sugar rush." },
      { id: "donut", label: "Donut", emoji: "🍩", description: "Glazed ring." },
    ],
  },
  {
    title: "Activities",
    data: [
      { id: "gaming", label: "Gaming", emoji: "🎮", description: "Level up." },
      { id: "movie", label: "Movie", emoji: "🎬", description: "Film night." },
      { id: "tv", label: "TV Show", emoji: "📺", description: "Binge watch." },
      { id: "basketball", label: "Hoops", emoji: "🏀", description: "Shoot some 3s." },
      { id: "nap", label: "Nap", emoji: "😴", description: "Power snooze." },
    ],
  },
];

export default function DrinksScreen() {
  const [selected, setSelected] = useState<RewardId>("beer");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load current selection
  useEffect(() => {
    const load = async () => {
      try {
        setError(null);
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          setError("Not logged in.");
          setLoading(false);
          return;
        }

        const { data, error: rewardError } = await supabase
          .from("reward_settings")
          .select("reward_id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (!rewardError && data?.reward_id) {
          setSelected(data.reward_id as RewardId);
        }
      } catch (e) {
        console.log("Load reward_settings error:", e);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const handleSelect = async (id: RewardId) => {
    setSelected(id);
    setSaving(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("Not logged in.");
        setSaving(false);
        return;
      }

      const { error: upsertError } = await supabase
        .from("reward_settings")
        .upsert(
          {
            user_id: user.id,
            reward_id: id,
          },
          { onConflict: "user_id" }
        );

      if (upsertError) {
        console.log("Reward upsert error:", upsertError);
        setError("Could not save your reward.");
      }
    } catch (e) {
      console.log("Reward select error:", e);
      setError("Something went wrong saving your choice.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={theme.colors.neonGold} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.heading}>Reward Hub</Text>
        <Text style={styles.subheading}>
          Choose what you’re working towards tonight.
        </Text>
      </View>

      {error && (
        <View style={styles.errorBanner}>
          <Ionicons name="warning" size={16} color={theme.colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* --- MAIN SCROLLVIEW --- */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {SECTIONS.map((section, index) => (
          <View key={section.title} style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            
            <View style={styles.gridContainer}>
              {section.data.map((item) => {
                const isActive = item.id === selected;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.card, isActive && styles.cardActive]}
                    onPress={() => handleSelect(item.id)}
                    activeOpacity={0.8}
                    disabled={saving}
                  >
                    <Text style={styles.rewardEmoji}>{item.emoji}</Text>
                    <Text style={styles.rewardLabel} numberOfLines={1}>
                      {item.label}
                    </Text>
                    
                    {isActive && (
                      <View style={styles.checkIcon}>
                         <Ionicons name="checkmark-circle" size={18} color={theme.colors.neonGold} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

/* ------------ STYLES ------------ */

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
    paddingTop: 50,
  },
  headerContainer: {
    paddingHorizontal: 24,
    marginBottom: 10,
  },
  heading: {
    color: theme.colors.textPrimary,
    fontSize: 28,
    fontWeight: "800",
  },
  subheading: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    marginTop: 4,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 80, 80, 0.1)",
    marginHorizontal: 24,
    marginBottom: 8,
    padding: 8,
    borderRadius: 12,
    gap: 8,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 13,
    fontWeight: "600",
  },
  scrollContent: {
    paddingBottom: 40,
  },
  sectionContainer: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.textPrimary,
    marginBottom: 12,
    marginLeft: 8,
    opacity: 0.9,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
  },
  card: {
    width: "31%", // roughly 3 items per row with margin
    aspectRatio: 1,
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    margin: "1.1%",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    position: "relative",
  },
  cardActive: {
    borderColor: theme.colors.neonGold,
    backgroundColor: "rgba(255, 215, 0, 0.05)",
    shadowColor: theme.colors.neonGold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  rewardEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  rewardLabel: {
    color: theme.colors.textPrimary,
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  checkIcon: {
    position: "absolute",
    top: 6,
    right: 6,
  },
});