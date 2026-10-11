import { Pressable, SectionList, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useLocalData } from "@/lib/use-data";
import { accountsWithBalances } from "@/lib/local-queries";
import { formatMoney } from "@/lib/money";
import { Screen, AccountAvatar, EmptyState, FAB, colors, moneyFont, radius } from "@/lib/ui";

type AccountRow = ReturnType<typeof accountsWithBalances>[number];

const TYPE_ORDER = ["BANK", "CASH", "ASSET"] as const;
const TYPE_LABEL: Record<string, string> = {
  BANK: "Bank",
  CASH: "Cash",
  ASSET: "Assets",
};

type Section = {
  key: string;
  title: string;
  subtotal: number | null; // null for the Archived group
  data: AccountRow[];
};

function buildSections(rows: AccountRow[]): Section[] {
  const active = rows.filter((a) => !a.archived);
  const sections: Section[] = TYPE_ORDER.map((t) => {
    const data = active.filter((a) => a.type === t);
    return {
      key: t,
      title: TYPE_LABEL[t],
      subtotal: data.reduce((s, a) => s + a.balance, 0),
      data,
    };
  }).filter((s) => s.data.length > 0);

  const archived = rows.filter((a) => a.archived);
  if (archived.length) {
    sections.push({ key: "ARCHIVED", title: "Archived", subtotal: null, data: archived });
  }
  return sections;
}

export default function AccountsScreen() {
  const router = useRouter();
  const { ready, accounts, transactions, baseCurrency, bankLinks } =
    useLocalData();
  const rows = accountsWithBalances(accounts, transactions);
  const sections = buildSections(rows);
  const total = rows
    .filter((a) => !a.archived)
    .reduce((sum, a) => sum + a.balance, 0);
  const money = (n: number) => formatMoney(n, baseCurrency);

  return (
    <Screen>
      {rows.length ? (
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Total balance</Text>
          <Text style={styles.totalValue}>{money(total)}</Text>
        </View>
      ) : null}
      <SectionList
        sections={sections}
        keyExtractor={(a) => a.id}
        stickySectionHeadersEnabled={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={sections.length ? styles.content : styles.emptyContent}
        ListEmptyComponent={
          ready ? (
            <EmptyState
              icon="wallet-outline"
              title="No accounts yet"
              message="Add a bank, cash, or asset account to start."
            />
          ) : null
        }
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionMeta}>
              {section.subtotal != null
                ? money(section.subtotal)
                : `${section.data.length} hidden`}
            </Text>
          </View>
        )}
        renderItem={({ item, index, section }) => {
          const first = index === 0;
          const last = index === section.data.length - 1;
          const dim = item.archived;
          const sub = [
            item.currency !== baseCurrency ? item.currency : null,
            item.note?.trim() || null,
          ]
            .filter(Boolean)
            .join(" · ");
          return (
            <View
              style={[styles.card, first && styles.cardFirst, last && styles.cardLast]}
            >
              <Pressable
                style={({ pressed }) => [styles.row, pressed && styles.pressed]}
                onPress={() =>
                  router.push({ pathname: "/account-form", params: { id: item.id } })
                }
              >
                <View style={dim && styles.dimmed}>
                  <AccountAvatar
                    name={item.name}
                    type={item.type}
                    bankSlug={bankLinks[item.id]}
                  />
                </View>
                <View style={styles.flex}>
                  <Text
                    style={[styles.name, dim && styles.dim]}
                    numberOfLines={1}
                  >
                    {item.name}
                  </Text>
                  {sub ? (
                    <Text style={styles.sub} numberOfLines={1}>
                      {sub}
                    </Text>
                  ) : null}
                </View>
                <Text
                  style={[
                    styles.balance,
                    { color: dim ? colors.faint : item.balance < 0 ? colors.danger : colors.text },
                  ]}
                >
                  {formatMoney(item.balance, item.currency)}
                </Text>
              </Pressable>
              {last ? null : <View style={styles.divider} />}
            </View>
          );
        }}
      />
      <FAB label="Add" onPress={() => router.push("/account-form")} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingBottom: 96 },
  emptyContent: { flexGrow: 1, justifyContent: "center" },

  totalCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: 18,
    marginBottom: 6,
  },
  totalLabel: { color: colors.muted, fontSize: 13, fontWeight: "600" },
  totalValue: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
    marginTop: 4,
    ...moneyFont,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 18,
    paddingBottom: 8,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    color: colors.muted,
  },
  sectionMeta: { fontSize: 13, fontWeight: "700", color: colors.text, ...moneyFont },

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
  dimmed: { opacity: 0.45 },
  name: { fontSize: 15, fontWeight: "600", color: colors.text },
  dim: { color: colors.muted },
  sub: { fontSize: 13, color: colors.muted, marginTop: 2 },
  balance: { fontSize: 15.5, fontWeight: "700", ...moneyFont },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginLeft: 66 },
});
