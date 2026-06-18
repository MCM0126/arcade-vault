import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/supabase/types";

// lowercase + uppercase + digit + symbol, minimum 8 chars
export const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).{8,}$/;

export async function signIn(email: string, password: string) {
  const supabase = createClient();
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signUp(
  email: string,
  password: string,
  username: string
) {
  if (!PASSWORD_REGEX.test(password)) {
    return {
      data: { user: null, session: null },
      error: {
        message:
          "La contraseña debe tener al menos 8 caracteres con mayúsculas, minúsculas, números y símbolos.",
      },
    } as const;
  }
  const supabase = createClient();
  return supabase.auth.signUp({
    email,
    password,
    options: { data: { username } },
  });
}

export async function signInWithOAuth(provider: "google" | "github") {
  const supabase = createClient();
  return supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${window.location.origin}/auth/callback?type=oauth`,
    },
  });
}

export async function signOut() {
  const supabase = createClient();
  return supabase.auth.signOut();
}

export async function getSession() {
  const supabase = createClient();
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  return data as Profile | null;
}

export async function createProfile(
  userId: string,
  username: string
): Promise<{ error: string | null }> {
  const supabase = createClient();
  const { error } = await supabase
    .from("profiles")
    .insert({ id: userId, username });
  if (!error) {
    // Store username in user_metadata so Nav can read it from the JWT without a DB call
    await supabase.auth.updateUser({ data: { username } });
  }
  return { error: error?.message ?? null };
}
