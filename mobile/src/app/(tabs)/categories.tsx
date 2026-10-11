import { Pressable, SectionList, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useLocalData } from "@/lib/use-data";
import { Screen, Avatar, EmptyState, FAB, colors, radius } from "@/lib/ui";

type Category = ReturnType<typeof useLocalData>["categories"][number];

type Section = { key: string; title: string; data: Category[] };

// Income first, then Expense; each sorted by name. Section headers carry the
// kind, so rows don't repeat it.
const KINDS = [
  { key: "INCOME", title: "Income", icon: "arrow-down-circle" as const, color: colors.income },
  { key: "EXPENSE", title: "Expense", icon: "arrow-up-circle" as const, color: colors.danger },
];

function buildSections(rows: Category[]): Section[] {
  return KINDS.map(({ key, title }) => ({
    key,
    title,
    data: rows
      .filter((c) => c.kind === key)
      .sort((a, b) => a.name.localeCompare(b.name)),
  })).filter((s) => s.data.length > 0);
}

export default function CategoriesScreen() {
  const router = useRouter();
  const { ready, categories } = useLocalData();
  const rows = categories.filter((c) => !c.deletedAt && !c.archived);
  const sections = buildSections(rows);

  return (
    <Screen>
      <SectionList
        sections={sections}
        keyExtractor={(c) => c.id}
        stickySectionHeadersEnabled={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={sections.length ? styles.content : styles.emptyContent}
        ListEmptyComponent={
          ready ? (
            <EmptyState
              icon="pricetags-outline"
              title="No categories yet"
              message="Create income and expense categories to organize spending."
            />
          ) : null
        }
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionMeta}>{section.data.length}</Text>
          </View>
        )}
        renderItem={({ item, index, section }) => {
          const first = index === 0;
          const last = index === section.data.length - 1;
          const kind = KINDS.find((k) => k.key === item.kind)!;
          return (
            <View
              style={[styles.card, first && styles.cardFirst, last && styles.cardLast]}
            >
              <Pressable
                style={({ pressed }) => [styles.row, pressed && styles.pressed]}
                onPress={() =>
                  router.push({ pathname: "/category-form", params: { id: item.id } })
                }
              >
                <Avatar icon={kind.icon} color={item.color || kind.color} />
                <Text style={styles.name} numberOfLines={1}>
                  {item.name}
                </Text>
                <Ionicons name="chevron-forward" size={18} color={colors.faint} />
              </Pressable>
              {last ? null : <View style={styles.divider} />}
            </View>
          );
        }}
      />
      <FAB label="Add" onPress={() => router.push("/category-form")} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 96 },
  emptyContent: { flexGrow: 1, justifyContent: "center" },

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
  sectionMeta: { fontSize: 13, fontWeight: "700", color: colors.muted },

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
    minHeight: 60,
  },
  pressed: { opacity: 0.6 },
  name: { flex: 1, fontSize: 15, fontWeight: "600", color: colors.text },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginLeft: 66 },
});
