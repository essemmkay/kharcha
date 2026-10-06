import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AuthProvider, useAuth } from "@/lib/auth";

// Redirects between the auth stack and the tabs based on the session, once the
// initial session load settles. Groups in parentheses are transparent in the
// URL, so the targets are "/login" and "/".
function RootNavigator() {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const inAuthGroup = segments[0] === "(auth)";
    if (!session && !inAuthGroup) router.replace("/login");
    else if (session && inAuthGroup) router.replace("/");
  }, [session, loading, segments, router]);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen
        name="account-form"
        options={{ presentation: "modal", title: "Account" }}
      />
      <Stack.Screen
        name="category-form"
        options={{ presentation: "modal", title: "Category" }}
      />
      <Stack.Screen
        name="transaction-form"
        options={{ presentation: "modal", title: "Transaction" }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="auto" />
      <RootNavigator />
    </AuthProvider>
  );
}
