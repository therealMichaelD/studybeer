import { Ionicons } from "@expo/vector-icons"; // Standard in Expo
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { neonGlow } from "../../constants/styles";
import { theme } from "../../constants/theme";
import { supabase } from "../../lib/supabase";

const { width } = Dimensions.get("window");

export default function AuthScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current; // Initial value for opacity: 0

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 🔒 If already logged in → go to app
  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        router.replace("/(tabs)/home");
      }
    });
  }, []);

  const handleAuth = async () => {
    setError("");
    setLoading(true);

    if (!email || !password) {
      setError("Please enter both email and password.");
      setLoading(false);
      return;
    }

    let result;

    if (isLogin) {
      result = await supabase.auth.signInWithPassword({
        email,
        password,
      });
    } else {
      result = await supabase.auth.signUp({
        email,
        password,
      });
    }

    if (result.error) {
      setError(result.error.message);
      setLoading(false);
      return;
    }

    // Router will handle the redirect, but we stop loading
    setLoading(false);
    router.replace("/(tabs)/home");
  };

  return (
    <View style={styles.mainContainer}>
      {/* Background decoration circles for depth */}
      <View style={[styles.bgCircle, styles.bgCircleTop]} />
      <View style={[styles.bgCircle, styles.bgCircleBottom]} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <Animated.View style={[styles.contentContainer, { opacity: fadeAnim }]}>
          
          {/* Header Section */}
          <View style={styles.header}>
            <View style={[styles.iconContainer, neonGlow]}>
              <Text style={styles.emojiIcon}>🍺</Text>
            </View>
            <Text style={styles.title}>StudyBeer</Text>
            <Text style={styles.subtitle}>
              Earn your night out the <Text style={styles.highlight}>smart</Text> way.
            </Text>
          </View>

          {/* Form Section */}
          <View style={styles.formContainer}>
            {/* Email Input */}
            <View style={styles.inputWrapper}>
              <Ionicons
                name="mail-outline"
                size={20}
                color={theme.colors.textSecondary}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Email Address"
                placeholderTextColor={theme.colors.textSecondary}
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            {/* Password Input */}
            <View style={styles.inputWrapper}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={theme.colors.textSecondary}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor={theme.colors.textSecondary}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>

            {error ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={16} color={theme.colors.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Main Action Button */}
            <TouchableOpacity
              style={[styles.button, neonGlow]}
              onPress={handleAuth}
              activeOpacity={0.8}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.buttonText}>
                  {isLogin ? "Sign In" : "Create Account"}
                </Text>
              )}
            </TouchableOpacity>

            {/* Toggle Login/Signup */}
            <TouchableOpacity
              onPress={() => {
                setError("");
                setIsLogin((prev) => !prev);
              }}
              style={styles.toggle}
            >
              <Text style={styles.toggleText}>
                {isLogin ? "New here? " : "Returned? "}
                <Text style={styles.toggleTextBold}>
                  {isLogin ? "Create an account" : "Sign in"}
                </Text>
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: theme.colors.background || "#121212", // Fallback if theme is missing
  },
  keyboardView: {
    flex: 1,
    justifyContent: "center",
  },
  contentContainer: {
    paddingHorizontal: 30,
    alignItems: "center",
    zIndex: 10,
  },
  // Background Ambient Effects
  bgCircle: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
    opacity: 0.1,
  },
  bgCircleTop: {
    top: -50,
    left: -100,
    backgroundColor: theme.colors.neonGold,
  },
  bgCircleBottom: {
    bottom: -50,
    right: -100,
    backgroundColor: theme.colors.neonGold,
  },
  
  // Header Styles
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.05)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.neonGold,
  },
  emojiIcon: {
    fontSize: 40,
  },
  title: {
    color: theme.colors.neonGold,
    fontSize: 36,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 8,
    textShadowColor: 'rgba(255, 215, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  subtitle: {
    color: theme.colors.textSecondary,
    fontSize: 16,
    textAlign: "center",
    lineHeight: 22,
    maxWidth: width * 0.7,
  },
  highlight: {
    color: "#FFF",
    fontWeight: "bold",
  },

  // Form Styles
  formContainer: {
    width: "100%",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    height: 56,
  },
  inputIcon: {
    marginLeft: 16,
    marginRight: 8,
  },
  input: {
    flex: 1,
    color: theme.colors.textPrimary || "#FFF",
    fontSize: 16,
    height: "100%",
    paddingRight: 16,
  },
  
  // Error Styles
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 0, 0, 0.1)",
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
    justifyContent: 'center'
  },
  errorText: {
    color: theme.colors.error,
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500'
  },

  // Button Styles
  button: {
    backgroundColor: theme.colors.neonGold,
    height: 56,
    borderRadius: theme.radius.md,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
    shadowColor: theme.colors.neonGold,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  buttonText: {
    color: "#000",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0.5,
  },

  // Toggle Styles
  toggle: {
    marginTop: 24,
    alignItems: "center",
  },
  toggleText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
  },
  toggleTextBold: {
    color: theme.colors.neonGold,
    fontWeight: "700",
  },
});