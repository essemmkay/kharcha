import "react-native-url-polyfill/auto";
import { AppState, Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import { createClient } from "@supabase/supabase-js";

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !anonKey) {
  throw new Error(
    "Missing EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY. Copy mobile/.env.example to mobile/.env and fill them in.",
  );
}

// Supabase session storage backed by the device keychain/keystore.
// ponytail: expo-secure-store warns above ~2KB per value; a single Supabase
// session usually fits. If the warning ever bites, switch to the LargeSecureStore
// pattern (AES key in SecureStore, ciphertext in AsyncStorage).
const SecureStorageAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

export const supabase = createClient(url, anonKey, {
  auth: {
    // SecureStore is native-only; let supabase-js fall back to its default
    // (web localStorage) when running under expo web.
    storage: Platform.OS === "web" ? undefined : SecureStorageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Per Supabase RN guidance: only auto-refresh the token while the app is active.
AppState.addEventListener("change", (state) => {
  if (state === "active") supabase.auth.startAutoRefresh();
  else supabase.auth.stopAutoRefresh();
});
