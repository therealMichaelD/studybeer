// app/_layout.tsx
import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function RootLayout() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Debug
  console.log("SESSION STATE:", session);

  useEffect(() => {

    // Get current session
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    // Listen for changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  // Still checking session
  if (loading) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {session ? (
        // AUTHENTICATED → Show tabs
        <Stack.Screen name="(tabs)" />
      ) : (
        // NOT LOGGED IN → Show onboarding flow
        <>
          <Stack.Screen name="onboarding/index" />
        </>
      )}
    </Stack>
  );
}