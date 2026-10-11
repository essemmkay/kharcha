import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/lib/auth";
import { Screen, Card, Button, Avatar, colors, radius } from "@/lib/ui";

type IoniconName = keyof typeof Ionicons.glyphMap;

export default function SettingsScreen() {
  const router = useRouter();
  const { session, signOut } = useAuth();
  const email = session?.user.email ?? "unknown";

  return (
    <Screen style={{ justifyContent: "space-between" }}>
      <View style={{ gap: 12 }}>
        <Card style={styles.profile}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{email.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.flex}>
            <Text style={styles.label}>Signed in as</Text>
            <Text style={styles.email} numberOfLines={1}>
              {email}
            </Text>
          </View>
        </Card>

        <Card style={styles.group}>
          <NavRow
            icon="document-text-outline"
            label="Reports & export"
            onPress={() => router.push("/reports")}
          />
          <View style={styles.divider} />
          <NavRow
            icon="pricetags-outline"
            label="Manage categories"
            onPress={() => router.push("/categories")}
          />
        </Card>

        <Card style={styles.group}>
          <View style={styles.infoRow}>
            <View style={styles.infoLeft}>
              <Ionicons name="cloud-done-outline" size={19} color={colors.muted} />
              <Text style={styles.rowText}>Offline-first sync</Text>
            </View>
            <Text style={styles.infoMuted}>On</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <View style={styles.infoLeft}>
              <Ionicons name="phone-portrait-outline" size={19} color={colors.muted} />
              <Text style={styles.rowText}>Version</Text>
            </View>
            <Text style={styles.infoMuted}>1.0.0</Text>
          </View>
        </Card>
      </View>

      <Button label="Sign out" variant="danger" icon="log-out-outline" onPress={signOut} />
    </Screen>
  );
}

function NavRow({
  icon,
  label,
  onPress,
}: {
  icon: IoniconName;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.navRow, pressed && styles.pressed]}
    >
      <Avatar icon={icon} />
      <Text style={styles.navText}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={colors.faint} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  profile: { flexDirection: "row", alignItems: "center", gap: 14 },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: colors.primaryText, fontSize: 22, fontWeight: "800" },
  label: { fontSize: 13, color: colors.muted, fontWeight: "600" },
  email: { fontSize: 17, fontWeight: "700", color: colors.text, marginTop: 2 },

  group: { paddingVertical: 4 },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginLeft: 52,
  },

  navRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
  },
  navText: { flex: 1, fontSize: 15, fontWeight: "600", color: colors.text },
  pressed: { opacity: 0.6 },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  infoLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  rowText: { fontSize: 15, color: colors.text, fontWeight: "500" },
  infoMuted: { fontSize: 15, color: colors.muted, fontWeight: "600" },
});
