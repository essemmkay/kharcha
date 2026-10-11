import { useState } from "react";
import { Pressable, SectionList, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { format, isSameYear, isToday, isYesterday } from "date-fns";
import { useLocalData } from "@/lib/use-data";
import { listLocalTransactions, type TxFilter } from "@/lib/local-queries";
import type { TxRow } from "@/lib/tx-row";
import { signedMoney } from "@/lib/money";
import {
  Screen,
  Segmented,
  Avatar,
  EmptyState,
  colors,
  moneyFont,
  radius,
} from "@/lib/ui";

type FilterType = "ALL" | "INCOME" | "EXPENSE" | "TRANSFER";

const meta = (type: string) =>
  type === "INCOME"
    ? { color: colors.income, icon: "arrow-down-outline" as const }
    : type === "EXPENSE"
      ? { color: colors.danger, icon: "arrow-up-outline" as const }
      : { color: colors.muted, icon: "swap-horizontal-outline" as const };

// Primary line leads with what the transaction was: the note, then the
// category, then a sensible fallback. Transfers read as "From → To".
function lines(tx: TxRow): { primary: string; secondary: string } {
  const note = tx.note?.trim();
  if (tx.type === "TRANSFER") {
    return {
      primary: `${tx.account} → ${tx.toAccount ?? "?"}`,
      secondary: note || "Transfer",
    };
  }
  if (note) {
    return { primary: note, secondary: `${tx.category ?? "Uncategorized"} · ${tx.account}` };
  }
  return { primary: tx.category ?? "Uncategorized", secondary: tx.account };
}

function dayLabel(iso: string): string {
  const d = new Date(iso);
  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  return format(d, isSameYear(d, new Date()) ? "EEEE, MMM d" : "MMM d, yyyy");
}

// Rows arrive already sorted newest-first; bucket consecutive runs into days.
function groupByDay(rows: TxRow[]): { key: string; title: string; data: TxRow[] }[] {
  const out: { key: string; title: string; data: TxRow[] }[] = [];
  for (const r of rows) {
    const key = format(new Date(r.date), "yyyy-MM-dd");
    const last = out[out.length - 1];
    if (last && last.key === key) last.data.push(r);
    else out.push({ key, title: dayLabel(r.date), data: [r] });
  }
  return out;
}

export default function TransactionsScreen() {
  const router = useRouter();
  const { ready, accounts, categories, transactions } = useLocalData();
  const [type, setType] = useState<FilterType>("ALL");

  const filter: TxFilter = type === "ALL" ? {} : { type };
  const rows = listLocalTransactions(transactions, accounts, categories, filter);
  const sections = groupByDay(rows);

  return (
    <Screen>
      <View style={styles.filter}>
        <Segmented
          value={type}
          onChange={setType}
          options={[
            { value: "ALL", label: "All" },
            { value: "INCOME", label: "In" },
            { value: "EXPENSE", label: "Out" },
            { value: "TRANSFER", label: "Transfer" },
          ]}
        />
      </View>
      <SectionList
        sections={sections}
        keyExtractor={(t) => t.id}
        stickySectionHeadersEnabled
        showsVerticalScrollIndicator={false}
        contentContainerStyle={sections.length ? styles.content : styles.emptyContent}
        ListEmptyComponent={
          ready ? (
            <EmptyState
              icon="receipt-outline"
              title="No transactions yet"
              message="Tap + to add your first one."
            />
          ) : null
        }
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionHeader}>{section.title}</Text>
        )}
        renderItem={({ item, index, section }) => {
          const m = meta(item.type);
          const { primary, secondary } = lines(item);
          const first = index === 0;
          const last = index === section.data.length - 1;
          return (
            <View
              style={[
                styles.card,
                first && styles.cardFirst,
                last && styles.cardLast,
              ]}
            >
              <Pressable
                style={({ pressed }) => [styles.row, pressed && styles.pressed]}
                onPress={() =>
                  router.push({
                    pathname: "/transaction-form",
                    params: { id: item.id },
                  })
                }
              >
                <Avatar icon={m.icon} color={item.categoryColor ?? m.color} />
                <View style={styles.flex}>
                  <Text style={styles.primary} numberOfLines={1}>
                    {primary}
                  </Text>
                  <Text style={styles.secondary} numberOfLines={1}>
                    {secondary}
                  </Text>
                </View>
                <Text style={[styles.amount, { color: m.color }]}>
                  {signedMoney(item.amount, item.type, item.currency)}
                </Text>
              </Pressable>
              {last ? null : <View style={styles.divider} />}
            </View>
          );
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  filter: { marginBottom: 6 },
  flex: { flex: 1 },
  content: { paddingBottom: 32 },
  emptyContent: { flexGrow: 1, justifyContent: "center" },

  sectionHeader: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    color: colors.muted,
    backgroundColor: colors.bg,
    paddingTop: 16,
    paddingBottom: 8,
    paddingHorizontal: 4,
  },

  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderRightWidth: StyleSheet.hairlineWidth,
  },
  cardFirst: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
  },
  cardLast: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    minHeight: 64,
  },
  pressed: { opacity: 0.6 },
  primary: { fontSize: 15, fontWeight: "600", color: colors.text },
  secondary: { fontSize: 13, color: colors.muted, marginTop: 2 },
  amount: { fontSize: 15.5, fontWeight: "700", ...moneyFont },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginLeft: 66 },
});
