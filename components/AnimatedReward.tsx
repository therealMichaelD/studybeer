// components/AnimatedReward.tsx
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { theme } from "../constants/theme";

// 1. IMPORT THE SUB-COMPONENTS
import GenericProgress, { RewardId } from "./rewards/GenericProgress";

import BeerProgress from "./rewards/BeerProgress";
import CocktailProgress from "./rewards/CocktailProgress";
import MartiniProgress from "./rewards/MartiniProgress";
import SakeProgress from "./rewards/SakeProgress";
import WhiskeyProgress from "./rewards/WhiskeyProgress";
import WineProgress from "./rewards/WineProgress";

import BobaProgress from "./rewards/BobaProgress";
import BurgerProgress from "./rewards/BurgerProgress";
import ChocolateProgress from "./rewards/ChocolateProgress";
import CoffeeProgress from "./rewards/CoffeeProgress";
import DonutProgress from "./rewards/DonutProgress";
import IceCreamProgress from "./rewards/IceCreamProgress";
import PizzaProgress from "./rewards/PizzaProgress";
import SodaProgress from "./rewards/SodaProgress";
import SushiProgress from "./rewards/SushiProgress";
import TacosProgress from "./rewards/TacosProgress";

import GamingProgress from "./rewards/GamingProgress";
import HoopsProgress from "./rewards/HoopsProgress";
import MovieProgress from "./rewards/MovieProgress";
import NapProgress from "./rewards/NapProgress";
import TVShowProgress from "./rewards/TVShowProgress";

// 2. RE-EXPORT THE TYPE (So drinks.tsx doesn't break)
export type { RewardId };

// 3. MAPPING FOR THE SMALL ICON IN THE CORNER
const REWARD_ICONS: Record<RewardId, string> = {
  beer: "🍺", wine: "🍷", martini: "🍸", whiskey: "🥃", cocktail: "🍹", sake: "🍶", tequila: "🌵",
  pizza: "🍕", burger: "🍔", sushi: "🍣", tacos: "🌮", boba: "🧋", coffee: "☕", soda: "🥤", icecream: "🍨", chocolate: "🍫", donut: "🍩",
  movie: "🎬", gaming: "🎮", basketball: "🏀", gym: "💪", nap: "😴", reading: "📚", walk: "🚶", tv: "📺",
};

export interface AnimatedRewardProps {
  progress: number;
  drinksEarned: number;
  totalTasks: number;
  completedTasks: number;
  rewardId: RewardId;
}

export default function AnimatedReward({
  progress,
  drinksEarned,
  totalTasks,
  completedTasks,
  rewardId,
}: AnimatedRewardProps) {
  
  const currentEmoji = REWARD_ICONS[rewardId] || "🏆";

  // 4. THE ROUTER LOGIC
  const renderVisual = () => {
    switch (rewardId) {
      // Beer Animation 
        case "beer":
        return <BeerProgress progress={progress} />;
      
      // Wine animation
        case "wine":
        return <WineProgress progress={progress} />;

        // martini animation
        case "martini":
        return <MartiniProgress progress={progress} />;

        // Whiskey animation
        case "whiskey":
        return <WhiskeyProgress progress={progress} />;

        // Cocktail animation
        case "cocktail":
        return <CocktailProgress progress={progress} />;

        // Sake animation
        case "sake":
        return <SakeProgress progress={progress} />;

        // Coffee animation
        case "coffee":
        return <CoffeeProgress progress={progress} />;

        // Boba animation
        case "boba":
        return <BobaProgress progress={progress} />;

        // Soda animation
        case "soda":
        return <SodaProgress progress={progress} />;

        // Pizza animation
        case "pizza":
        return <PizzaProgress progress={progress} />;

        // Burger animation
        case "burger":
        return <BurgerProgress progress={progress} />;

        // Sushi animation
        case "sushi":
        return <SushiProgress progress={progress} />;

        // Tacos animation
        case "tacos":
        return <TacosProgress progress={progress} />;

        // IceCream animation
        case "icecream":
        return <IceCreamProgress progress={progress} />;

        // Chocolate animation
        case "chocolate":
        return <ChocolateProgress progress={progress} />;

        // Donut animation
        case "donut":
        return <DonutProgress progress={progress} />;



        // Gaming animation
        case "gaming":
        return <GamingProgress progress={progress} />;

        // Movie animation
        case "movie":
        return <MovieProgress progress={progress} />;

        // TVShow animation
        case "tv":
        return <TVShowProgress progress={progress} />;

        // Hoops animation
        case "basketball":
        return <HoopsProgress progress={progress} />;

        // Nap animation
        case "nap":
        return <NapProgress progress={progress} />;



      // FUTURE: Add more custom cases here
      // case "pizza":
      //   return <PizzaProgress progress={progress} />;

      default:
        // Everything else uses the generic Emoji + Bar
        return <GenericProgress progress={progress} rewardId={rewardId} />;
    }
  };

  return (
    <View style={[styles.card, styles.heroCard]}>
      <View style={styles.progressHeader}>
        <View>
          <Text style={styles.cardLabel}>Session Progress</Text>
          <Text style={styles.percentText}>{Math.round(progress * 100)}%</Text>
        </View>

        <View style={styles.scoreBadge}>
          <Text style={{ fontSize: 14 }}>{currentEmoji}</Text>
          <Text style={styles.scoreText}>{drinksEarned}</Text>
        </View>
      </View>

      <View style={styles.visualContainer}>
        {renderVisual()}
      </View>

      <Text style={styles.progressHint}>
        {totalTasks === 0
          ? "Add tasks to start"
          : `${completedTasks}/${totalTasks} tasks completed`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 24,
    backgroundColor: theme.colors.card,
    borderRadius: 24,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  heroCard: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: theme.colors.textSecondary,
    textTransform: "uppercase",
  },
  percentText: {
    fontSize: 20,
    fontWeight: "700",
    color: theme.colors.neonGold,
  },
  scoreBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 215, 0, 0.15)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,215,0,0.3)",
    gap: 6,
  },
  scoreText: {
    color: theme.colors.neonGold,
    fontWeight: "700",
    fontSize: 14,
  },
  visualContainer: {
    width: "100%",
    alignItems: "center",
    marginTop: 10,
    minHeight: 120, // keeps card size stable
    justifyContent: "center",
  },
  progressHint: {
    textAlign: "center",
    marginTop: 8,
    color: theme.colors.textSecondary,
    fontSize: 12,
  },
});