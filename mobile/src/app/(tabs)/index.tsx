import { useSyncExternalStore } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useLocalData } from "@/lib/use-data";
import { getSyncing, subscribeSyncing } from "@/lib/sync/engine";
import { accountsWithBalances, netWorth } from "@/lib/local-queries";
import { formatMoney } from "@/lib/money";

// Minimal Dashboard: proves the local store + pure queries + sync pipeline are
// wired end to end. The full dashboard (charts, month switcher) lands in Phase 4.
export default function DashboardScreen() {
  const { ready, accounts, transactions, baseCurrency } = useLocalData();
  const syncing = useSyncExternalStore(subscribeSyncing, getSyncing, getSyncing);

  if (!ready) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  const live = accountsWithBalances(accounts, transactions);
  const total = netWorth(accounts, transactions);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Net worth</Text>
      <Text style={styles.netWorth}>{formatMoney(total, baseCurrency)}</Text>

      <View style={styles.row}>
        <Text style={styles.stat}>{live.length} accounts</Text>
        <Text style={styles.stat}>{transactions.length} transactions</Text>
      </View>

      <Text style={styles.sync}>
        {syncing ? "Syncing…" : "Up to date"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  container: { flex: 1, padding: 24, gap: 8 },
  label: { fontSize: 14, color: "#6b7280", marginTop: 8 },
  netWorth: { fontSize: 36, fontWeight: "700" },
  row: { flexDirection: "row", gap: 16, marginTop: 8 },
  stat: { fontSize: 15, color: "#374151" },
  sync: { marginTop: 16, fontSize: 13, color: "#9ca3af" },
});
