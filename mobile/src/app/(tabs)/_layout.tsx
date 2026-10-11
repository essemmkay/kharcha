import { type ColorValue, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Tabs, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSync } from "@/lib/sync/use-sync";
import { useAuth } from "@/lib/auth";
import { colors, radius, space } from "@/lib/ui";

type IoniconName = keyof typeof Ionicons.glyphMap;

// Each tab swaps to the filled glyph when focused for a clearer active state.
function tabIcon(outline: IoniconName, filled: IoniconName) {
  return ({ color, size, focused }: { color: ColorValue; size: number; focused: boolean }) => (
    <Ionicons name={focused ? filled : outline} color={color as string} size={size} />
  );
}

// Raised center button that opens the add-transaction modal (the app's most
// frequent write), replacing a normal tab slot.
function AddButton() {
  const router = useRouter();
  return (
    <View style={styles.addSlot} pointerEvents="box-none">
      <Pressable
        onPress={() => router.push("/transaction-form")}
        style={({ pressed }) => [styles.addBtn, pressed && styles.pressed]}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel="Add transaction"
      >
        <Ionicons name="add" size={32} color={colors.primaryText} />
      </Pressable>
    </View>
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

// Custom top bar: the Dashboard gets a personal greeting + profile avatar; every
// other tab gets a confident large title. Both align to the screen gutter and
// sit below the status bar via safe-area insets.
function AppHeader({ title, routeName }: { title?: string; routeName: string }) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { session } = useAuth();
  const email = session?.user.email ?? "";
  const name = email ? email.split("@")[0] : "there";
  const display = name.charAt(0).toUpperCase() + name.slice(1);
  const isHome = routeName === "index";
  // Off-bar destinations (reached via push) get a back affordance.
  const canBack = routeName === "categories" || routeName === "reports";

  return (
    <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
      {canBack ? (
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.navigate("/"))}
          style={({ pressed }) => [styles.back, pressed && styles.pressed]}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
      ) : null}
      <View style={styles.flex}>
        {isHome ? <Text style={styles.eyebrow}>{greeting()}</Text> : null}
        <Text style={styles.title} numberOfLines={1}>
          {isHome ? display : title}
        </Text>
      </View>
      {isHome ? (
        <Pressable
          onPress={() => router.navigate("/settings")}
          style={({ pressed }) => [styles.avatar, pressed && styles.pressed]}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Open settings"
        >
          <Text style={styles.avatarText}>{(email.charAt(0) || "?").toUpperCase()}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export default function TabsLayout() {
  // Drive background sync for the whole authenticated session (mount here once).
  useSync();
  return (
    <Tabs
      screenOptions={{
        header: ({ options, route }) => (
          <AppHeader title={options.title} routeName={route.name} />
        ),
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.faint,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.border,
          borderTopWidth: 0.5,
          height: Platform.OS === "ios" ? 88 : 64,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: "Dashboard", tabBarIcon: tabIcon("home-outline", "home") }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: "Transactions",
          tabBarIcon: tabIcon("swap-horizontal-outline", "swap-horizontal"),
        }}
      />
      <Tabs.Screen
        name="add"
        options={{ title: "Add", tabBarButton: () => <AddButton /> }}
      />
      <Tabs.Screen
        name="accounts"
        options={{ title: "Accounts", tabBarIcon: tabIcon("wallet-outline", "wallet") }}
      />
      <Tabs.Screen
        name="settings"
        options={{ title: "Settings", tabBarIcon: tabIcon("settings-outline", "settings") }}
      />
      {/* Lesser-used screens: reached from Settings, not the tab bar. */}
      <Tabs.Screen name="reports" options={{ href: null, title: "Reports" }} />
      <Tabs.Screen name="categories" options={{ href: null, title: "Categories" }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.bg,
    paddingHorizontal: space.lg,
    paddingBottom: 10,
    gap: 8,
  },
  back: { marginLeft: -6, marginBottom: 2, alignSelf: "flex-end" },
  flex: { flex: 1 },
  eyebrow: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.muted,
    letterSpacing: 0.2,
    marginBottom: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: -0.5,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: colors.primary, fontSize: 17, fontWeight: "800" },
  pressed: { opacity: 0.85, transform: [{ scale: 0.96 }] },

  addSlot: { flex: 1, alignItems: "center", justifyContent: "flex-start" },
  addBtn: {
    width: 58,
    height: 58,
    borderRadius: radius.pill,
    marginTop: -22,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: colors.tabBar,
    shadowColor: colors.primary,
    shadowOpacity: 0.45,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
});
