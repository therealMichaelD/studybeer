export const theme = {
  colors: {
    background: "#0A0A14",         // deep navy / almost black
    card: "rgba(255, 255, 255, 0.05)", // subtle frosted panel
    neonGold: "#FFCC4D",           // glowing amber neon
    neonGoldDim: "rgba(255, 204, 77, 0.4)",
    textPrimary: "#FFFFFF",
    textSecondary: "#A7A7A7",
    error: "#FF4D4D",
  },
  spacing: (n: number) => n * 8,
  radius: {
    sm: 8,
    md: 16,
    lg: 24,
    xl: 40,
  },
  font: {
    title: 28,
    subtitle: 18,
    body: 16,
    small: 14,
  },
};