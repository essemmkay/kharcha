import { useState, useSyncExternalStore } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { addMonths, format, isSameMonth, subMonths } from "date-fns";
import { useLocalData } from "@/lib/use-data";
import { getSyncing, subscribeSyncing } from "@/lib/sync/engine";
import {
  incomeExpenseSeries,
  monthlySummary,
  netWorth,
  netWorthSeries,
} from "@/lib/local-queries";
import { formatMoney } from "@/lib/money";
import { ExpenseDonut, IncomeExpenseBar, NetWorthLine } from "@/lib/charts";
import { Screen, Card, colors } from "@/lib/ui";

export default function DashboardScreen() {
  const { ready, accounts, categories, transactions, baseCurrency } =
    useLocalData();
  const syncing = useSyncExternalStore(subscribeSyncing, getSyncing, getSyncing);
  const [month, setMonth] = useState(new Date());

  if (!ready) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  const total = netWorth(accounts, transactions);
  const summary = monthlySummary(transactions, categories, month);
  const barSeries = incomeExpenseSeries(transactions, 6);
  const lineSeries = netWorthSeries(accounts, transactions, 12);
  const atCurrentMonth = isSameMonth(month, new Date());
  const money = (n: number) => formatMoney(n, baseCurrency);

  return (
    <Screen scroll>
      <View>
        <Text style={styles.label}>Net worth</Text>
        <Text style={styles.netWorth}>{money(total)}</Text>
        <Text style={styles.sync}>{syncing ? "Syncing…" : "Up to date"}</Text>
      </View>

      <View style={styles.switcher}>
        <TouchableOpacity
          style={styles.navBtn}
          onPress={() => setMonth((m) => subMonths(m, 1))}
        >
          <Text style={styles.navText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.monthLabel}>{format(month, "MMMM yyyy")}</Text>
        <TouchableOpacity
          style={[styles.navBtn, atCurrentMonth && styles.navBtnDisabled]}
          disabled={atCurrentMonth}
          onPress={() => setMonth((m) => addMonths(m, 1))}
        >
          <Text style={styles.navText}>›</Text>
        </TouchableOpacity>
      </View>

      <Card>
        <View style={styles.totalRow}>
          <Text style={styles.muted}>Income</Text>
          <Text style={{ color: colors.income, fontWeight: "600" }}>
            {money(summary.income)}
          </Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.muted}>Expense</Text>
          <Text style={{ color: colors.danger, fontWeight: "600" }}>
            {money(summary.expense)}
          </Text>
        </View>
        <View style={[styles.totalRow, styles.net]}>
          <Text style={{ fontWeight: "700" }}>Net</Text>
          <Text style={{ fontWeight: "700" }}>{money(summary.net)}</Text>
        </View>
      </Card>

      <Text style={styles.sectionTitle}>Expenses by category</Text>
      <Card>
        <ExpenseDonut data={summary.byCategory} currency={baseCurrency} />
      </Card>

      <Text style={styles.sectionTitle}>Income vs expense</Text>
      <Card>
        <IncomeExpenseBar series={barSeries} />
      </Card>

      <Text style={styles.sectionTitle}>Net worth trend</Text>
      <Card>
        <NetWorthLine series={lineSeries} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  label: { fontSize: 14, color: colors.muted },
  netWorth: { fontSize: 34, fontWeight: "700", color: colors.text },
  sync: { fontSize: 12, color: colors.muted, marginTop: 2 },
  switcher: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  navBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  navBtnDisabled: { opacity: 0.4 },
  navText: { fontSize: 18, color: colors.text },
  monthLabel: { fontSize: 16, fontWeight: "600", color: colors.text },
  muted: { color: colors.muted },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  net: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: 4,
    paddingTop: 10,
  },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginTop: 4 },
});
