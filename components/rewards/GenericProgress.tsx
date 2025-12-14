// components/rewards/GenericProgress.tsx
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { theme } from "../../constants/theme";

// We need the ID type to know which emoji to show
export type RewardId = 
  | "beer" | "wine" | "martini" | "whiskey" | "cocktail" | "sake" | "tequila"
  | "pizza" | "burger" | "sushi" | "tacos" | "boba" | "coffee" | "soda" | "icecream" | "chocolate" | "donut"
  | "movie" | "gaming" | "basketball" | "gym" | "nap" | "reading" | "walk" | "tv";

const REWARD_ICONS: Record<RewardId, string> = {
  beer: "🍺", wine: "🍷", martini: "🍸", whiskey: "🥃", cocktail: "🍹", sake: "🍶", tequila: "🌵",
  pizza: "🍕", burger: "🍔", sushi: "🍣", tacos: "🌮", boba: "🧋", coffee: "☕", soda: "🥤", icecream: "🍨", chocolate: "🍫", donut: "🍩",
  movie: "🎬", gaming: "🎮", basketball: "🏀", gym: "💪", nap: "😴", reading: "📚", walk: "🚶", tv: "📺",
};

interface Props {
  progress: number;
  rewardId: RewardId;
}

export default function GenericProgress({ progress, rewardId }: Props) {
  const currentEmoji = REWARD_ICONS[rewardId] || "🏆";

  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>{currentEmoji}</Text>
      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            { width: `${Math.min(progress * 100, 100)}%` },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    paddingVertical: 10,
    minHeight: 120,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 10,
  },
  track: {
    width: "60%",
    height: 8,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 4,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    backgroundColor: theme.colors.neonGold,
    borderRadius: 4,
  },
});