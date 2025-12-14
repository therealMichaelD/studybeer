import type { Session } from "@supabase/supabase-js";
import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function Index() {
  const [checking, setChecking] = useState(true);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
      setChecking(false);
    });
  }, []);

  if (checking) return null;

  return session ? <Redirect href="/(tabs)/home" /> : <Redirect href="/auth" />;
}