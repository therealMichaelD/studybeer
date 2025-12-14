import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { theme } from "../../constants/theme";

export default function HomeScreen() {
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Study Timer</Text>

      <Text style={styles.timerText}>
        {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}
      </Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => setRunning(!running)}
      >
        <Text style={styles.buttonText}>
          {running ? "Stop" : "Start"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: theme.font.title,
    color: theme.colors.textPrimary,
    marginBottom: 24,
  },
  timerText: {
    fontSize: 64,
    fontWeight: "bold",
    color: theme.colors.neonGold,
    marginBottom: 40,
  },
  button: {
    backgroundColor: theme.colors.neonGold,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: theme.radius.md,
  },
  buttonText: {
    color: theme.colors.background,
    fontSize: 22,
    fontWeight: "600",
  },
});