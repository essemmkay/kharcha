import { useState, useSyncExternalStore } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { addMonths, format, isSameMonth, subMonths } from "date-fns";
import { useLocalData } from "@/lib/use-data";
import { getLastError, getSyncing, subscribeSyncing } from "@/lib/sync/engine";
import {
  accountsWithBalances,
  incomeExpenseSeries,
  monthlySummary,
  netWorth,
  netWorthSeries,
} from "@/lib/local-queries";
import { formatMoney } from "@/lib/money";
import { ExpenseDonut, IncomeExpenseBar, NetWorthLine } from "@/lib/charts";
import {
  Screen,
  Card,
  SectionTitle,
  colors,
  moneyFont,
  radius,
} from "@/lib/ui";

export default function DashboardScreen() {
  const router = useRouter();
  const { ready, accounts, categories, transactions, baseCurrency } =
    useLocalData();
  const syncing = useSyncExternalStore(subscribeSyncing, getSyncing, getSyncing);
  const syncError = useSyncExternalStore(
    subscribeSyncing,
    getLastError,
    getLastError,
  );
  const [month, setMonth] = useState(new Date());

  if (!ready) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const total = netWorth(accounts, transactions);
  const accountRows = accountsWithBalances(accounts, transactions).filter(
    (a) => !a.archived,
  );
  const summary = monthlySummary(transactions, categories, month);
  const barSeries = incomeExpenseSeries(transactions, 6);
  const lineSeries = netWorthSeries(accounts, transactions, 12);
  const atCurrentMonth = isSameMonth(month, new Date());
  const money = (n: number) => formatMoney(n, baseCurrency);

  // Month-over-month net-worth change from the last two trend points.
  const prev = lineSeries[lineSeries.length - 2]?.value;
  const delta =
    prev !== undefined && prev !== 0 ? (total - prev) / Math.abs(prev) : null;

  return (
    <Screen scroll>
      <View style={styles.hero}>
        <View style={styles.heroTop}>
          <Text style={styles.heroLabel}>Net worth</Text>
          <View style={styles.syncPill}>
            <View
              style={[
                styles.syncDot,
                { backgroundColor: syncError ? "#FCA5A5" : "#86EFAC" },
              ]}
            />
            <Text style={styles.syncText}>
              {syncError ? "Sync error" : syncing ? "Syncing" : "Up to date"}
            </Text>
          </View>
        </View>
        <Text style={styles.heroAmount}>{money(total)}</Text>
        {delta !== null ? (
          <View style={styles.deltaRow}>
            <Ionicons
              name={delta >= 0 ? "trending-up" : "trending-down"}
              size={16}
              color="#fff"
            />
            <Text style={styles.deltaText}>
              {delta >= 0 ? "+" : ""}
              {(delta * 100).toFixed(1)}% vs last month
            </Text>
          </View>
        ) : null}

        {accountRows.length ? (
          <View style={styles.accountsWrap}>
            <View style={styles.heroDivider} />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.accountsRow}
            >
              {accountRows.map((a) => (
                <Pressable
                  key={a.id}
                  style={({ pressed }) => [styles.acctCard, pressed && styles.pressed]}
                  onPress={() =>
                    router.push({ pathname: "/account-form", params: { id: a.id } })
                  }
                >
                  <Text style={styles.acctName} numberOfLines={1}>
                    {a.name}
                  </Text>
                  <Text
                    style={[styles.acctBal, a.balance < 0 && styles.acctBalNeg]}
                    numberOfLines={1}
                  >
                    {formatMoney(a.balance, a.currency)}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        ) : null}
      </View>

      <View style={styles.switcher}>
        <Pressable
          style={styles.navBtn}
          onPress={() => setMonth((m) => subMonths(m, 1))}
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={20} color={colors.text} />
        </Pressable>
        <Text style={styles.monthLabel}>{format(month, "MMMM yyyy")}</Text>
        <Pressable
          style={[styles.navBtn, atCurrentMonth && styles.navBtnDisabled]}
          disabled={atCurrentMonth}
          onPress={() => setMonth((m) => addMonths(m, 1))}
          hitSlop={8}
        >
          <Ionicons name="chevron-forward" size={20} color={colors.text} />
        </Pressable>
      </View>

      <Card>
        <View style={styles.totalRow}>
          <View style={styles.legendLeft}>
            <View style={[styles.dot, { backgroundColor: colors.income }]} />
            <Text style={styles.muted}>Income</Text>
          </View>
          <Text style={[styles.amt, { color: colors.income }]}>
            {money(summary.income)}
          </Text>
        </View>
        <View style={styles.totalRow}>
          <View style={styles.legendLeft}>
            <View style={[styles.dot, { backgroundColor: colors.danger }]} />
            <Text style={styles.muted}>Expense</Text>
          </View>
          <Text style={[styles.amt, { color: colors.danger }]}>
            {money(summary.expense)}
          </Text>
        </View>
        <View style={[styles.totalRow, styles.net]}>
          <Text style={styles.netLabel}>Net</Text>
          <Text
            style={[
              styles.netAmt,
              { color: summary.net >= 0 ? colors.income : colors.danger },
            ]}
          >
            {money(summary.net)}
          </Text>
        </View>
      </Card>

      <SectionTitle>Expenses by category</SectionTitle>
      <Card>
        <ExpenseDonut data={summary.byCategory} currency={baseCurrency} />
      </Card>

      <SectionTitle>Income vs expense</SectionTitle>
      <Card>
        <IncomeExpenseBar series={barSeries} />
      </Card>

      <SectionTitle>Net worth trend</SectionTitle>
      <Card>
        <NetWorthLine series={lineSeries} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bg,
  },

  hero: {
    borderRadius: radius.xl,
    padding: 22,
    gap: 10,
    backgroundColor: colors.ink,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.inkBorder,
    shadowColor: "#0B1120",
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heroLabel: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  heroAmount: {
    color: "#fff",
    fontSize: 40,
    fontWeight: "800",
    letterSpacing: -0.5,
    ...moneyFont,
  },
  deltaRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  deltaText: { color: "rgba(255,255,255,0.9)", fontSize: 13, fontWeight: "600" },
  syncPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.18)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  syncDot: { width: 7, height: 7, borderRadius: 4 },
  syncText: { color: "#fff", fontSize: 12, fontWeight: "600" },

  switcher: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
    marginTop: 4,
  },
  navBtn: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  navBtnDisabled: { opacity: 0.35 },
  monthLabel: { fontSize: 16, fontWeight: "700", color: colors.text },

  muted: { color: colors.muted, fontSize: 15 },
  legendLeft: { flexDirection: "row", alignItems: "center", gap: 9 },
  dot: { width: 9, height: 9, borderRadius: 5 },
  amt: { fontWeight: "700", fontSize: 15, ...moneyFont },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 7,
  },
  net: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    marginTop: 4,
    paddingTop: 12,
  },
  netLabel: { fontWeight: "700", fontSize: 16, color: colors.text },
  netAmt: { fontWeight: "800", fontSize: 18, ...moneyFont },

  pressed: { opacity: 0.6 },

  accountsWrap: { marginTop: 14, gap: 14 },
  heroDivider: { height: 1, backgroundColor: "rgba(255,255,255,0.22)" },
  accountsRow: { flexDirection: "row", gap: 10, paddingRight: 4 },
  acctCard: {
    backgroundColor: "rgba(255,255,255,0.16)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    minWidth: 132,
    gap: 4,
  },
  acctName: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 12.5,
    fontWeight: "600",
  },
  acctBal: { color: "#fff", fontSize: 17, fontWeight: "700", ...moneyFont },
  acctBalNeg: { color: "#FECACA" },
});
