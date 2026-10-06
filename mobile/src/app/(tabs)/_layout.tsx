import { type ColorValue } from "react-native";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSync } from "@/lib/sync/use-sync";

type IoniconName = keyof typeof Ionicons.glyphMap;

function icon(name: IoniconName) {
  // Tab color arrives as a ColorValue; at runtime it is a hex string.
  return ({ color, size }: { color: ColorValue; size: number }) => (
    <Ionicons name={name} color={color as string} size={size} />
  );
}

export default function TabsLayout() {
  // Drive background sync for the whole authenticated session (mount here once).
  useSync();
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: "#2563eb" }}>
      <Tabs.Screen
        name="index"
        options={{ title: "Dashboard", tabBarIcon: icon("home-outline") }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: "Transactions",
          tabBarIcon: icon("swap-horizontal-outline"),
        }}
      />
      <Tabs.Screen
        name="accounts"
        options={{ title: "Accounts", tabBarIcon: icon("wallet-outline") }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          title: "Categories",
          tabBarIcon: icon("pricetags-outline"),
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: "Reports",
          tabBarIcon: icon("document-text-outline"),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{ title: "Settings", tabBarIcon: icon("settings-outline") }}
      />
    </Tabs>
  );
}
