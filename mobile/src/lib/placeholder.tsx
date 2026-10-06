import { StyleSheet, Text, View } from "react-native";

// Stand-in for a tab that is built in a later phase. Keeps the navigation shell
// complete while Phase 3/4 fill in the real screens.
export function Placeholder({ title }: { title: string }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.note}>Coming in a later phase.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", gap: 6 },
  title: { fontSize: 22, fontWeight: "600" },
  note: { fontSize: 14, color: "#6b7280" },
});
