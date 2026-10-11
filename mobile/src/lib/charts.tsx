import { Dimensions, StyleSheet, Text, View } from "react-native";
import { BarChart, LineChart, PieChart } from "react-native-gifted-charts";
import { compactNumber } from "@/lib/compact";
import { formatMoney } from "@/lib/money";
import { colors } from "@/lib/ui";

const WIDTH = Dimensions.get("window").width - 64;

// Fallback palette for categories without an assigned color. Harmonized with
// the indigo/violet brand accent.
const PALETTE = [
  "#6366F1", "#8B5CF6", "#06B6D4", "#10B981", "#F59E0B",
  "#EC4899", "#3B82F6", "#14B8A6", "#F43F5E", "#A855F7",
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
      spacing: 3,
      labelWidth: 34,
      labelTextStyle: { color: colors.muted, fontSize: 11 },
    },
    { value: s.expense, frontColor: colors.danger },
  ]);

  return (
    <BarChart
      data={barData}
      width={WIDTH}
      height={160}
      barWidth={11}
      barBorderRadius={4}
      spacing={18}
      noOfSections={3}
      yAxisThickness={0}
      xAxisThickness={0}
      yAxisTextStyle={{ color: colors.faint, fontSize: 10 }}
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
      // gifted-charts renders the y-axis label column OUTSIDE `width`, so budget
      // for it here or the chart overruns the card. adjustToWidth spreads the
      // points across the remaining width.
      width={WIDTH - 44}
      adjustToWidth
      yAxisLabelWidth={40}
      endSpacing={0}
      height={160}
      color={colors.primary}
      thickness={2.5}
      curved
      areaChart
      startFillColor={colors.primary}
      endFillColor={colors.primary}
      startOpacity={0.22}
      endOpacity={0.02}
      hideDataPoints
      noOfSections={3}
      yAxisThickness={0}
      xAxisThickness={0}
      yAxisTextStyle={{ color: colors.faint, fontSize: 10 }}
      formatYLabel={(label) => compactNumber(Number(label))}
      xAxisLabelTextStyle={{ color: colors.muted, fontSize: 11 }}
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
