import { Dimensions, StyleSheet, Text, View } from "react-native";
import { BarChart, LineChart, PieChart } from "react-native-gifted-charts";
import { formatMoney } from "@/lib/money";
import { colors } from "@/lib/ui";

const WIDTH = Dimensions.get("window").width - 64;

// Fallback palette for categories without an assigned color.
const PALETTE = [
  "#2563eb", "#16a34a", "#dc2626", "#d97706", "#7c3aed",
  "#0891b2", "#db2777", "#65a30d", "#ea580c", "#4f46e5",
];

function Empty({ text }: { text: string }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.muted}>{text}</Text>
    </View>
  );
}

export function ExpenseDonut({
  data,
  currency,
}: {
  data: { name: string; color: string | null; total: number }[];
  currency: string;
}) {
  if (data.length === 0) return <Empty text="No expenses this month." />;
  const total = data.reduce((s, d) => s + d.total, 0);
  const pieData = data.map((d, i) => ({
    value: d.total,
    color: d.color || PALETTE[i % PALETTE.length],
  }));

  return (
    <View style={styles.donutWrap}>
      <PieChart
        data={pieData}
        donut
        radius={90}
        innerRadius={58}
        centerLabelComponent={() => (
          <View style={{ alignItems: "center" }}>
            <Text style={styles.centerLabel}>Spent</Text>
            <Text style={styles.centerValue}>{formatMoney(total, currency)}</Text>
          </View>
        )}
      />
      <View style={styles.legend}>
        {data.slice(0, 6).map((d, i) => (
          <View key={d.name} style={styles.legendRow}>
            <View
              style={[
                styles.dot,
                { backgroundColor: d.color || PALETTE[i % PALETTE.length] },
              ]}
            />
            <Text style={styles.legendName} numberOfLines={1}>
              {d.name}
            </Text>
            <Text style={styles.legendVal}>{formatMoney(d.total, currency)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export function IncomeExpenseBar({
  series,
}: {
  series: { label: string; income: number; expense: number }[];
}) {
  const hasData = series.some((s) => s.income > 0 || s.expense > 0);
  if (!hasData) return <Empty text="No income or expenses yet." />;

  const barData = series.flatMap((s) => [
    {
      value: s.income,
      frontColor: colors.income,
      label: s.label,
      spacing: 2,
      labelWidth: 34,
    },
    { value: s.expense, frontColor: colors.danger },
  ]);

  return (
    <BarChart
      data={barData}
      width={WIDTH}
      height={160}
      barWidth={12}
      spacing={18}
      noOfSections={3}
      yAxisThickness={0}
      xAxisThickness={0}
      hideRules
      disableScroll
    />
  );
}

export function NetWorthLine({
  series,
}: {
  series: { label: string; value: number }[];
}) {
  if (series.length === 0) return <Empty text="No accounts yet." />;
  const lineData = series.map((s) => ({ value: s.value, label: s.label }));

  return (
    <LineChart
      data={lineData}
      width={WIDTH}
      height={160}
      color={colors.primary}
      thickness={2}
      curved
      hideDataPoints
      noOfSections={3}
      yAxisThickness={0}
      xAxisThickness={0}
      hideRules
      disableScroll
    />
  );
}

const styles = StyleSheet.create({
  empty: { paddingVertical: 24, alignItems: "center" },
  muted: { color: colors.muted, fontSize: 14 },
  donutWrap: { alignItems: "center", gap: 16 },
  centerLabel: { fontSize: 12, color: colors.muted },
  centerValue: { fontSize: 15, fontWeight: "700", color: colors.text },
  legend: { alignSelf: "stretch", gap: 8 },
  legendRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  legendName: { flex: 1, color: colors.text },
  legendVal: { color: colors.text, fontWeight: "500" },
});
