import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useAuth } from "@/lib/auth";

export default function SettingsScreen() {
  const { session, signOut } = useAuth();

  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.label}>Signed in as</Text>
        <Text style={styles.email}>{session?.user.email ?? "unknown"}</Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={signOut}>
        <Text style={styles.buttonText}>Sign out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: "space-between" },
  label: { fontSize: 13, color: "#6b7280", marginTop: 12 },
  email: { fontSize: 17, fontWeight: "500", marginTop: 2 },
  button: {
    borderWidth: 1,
    borderColor: "#dc2626",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonText: { color: "#dc2626", fontSize: 16, fontWeight: "600" },
});
