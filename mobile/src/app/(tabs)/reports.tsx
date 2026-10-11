import { useState } from "react";
import { Alert, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { useLocalData } from "@/lib/use-data";
import { report } from "@/lib/local-queries";
import { monthRange } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { exportReportPdf } from "@/lib/report-pdf";
import {
  Screen,
  Card,
  Button,
  SectionTitle,
  ListRow,
  RowGroup,
  colors,
  moneyFont,
  radius,
} from "@/lib/ui";

export default function ReportsScreen() {
  const { accounts, categories, transactions, baseCurrency, name, email } =
    useLocalData();
  const initial = monthRange();
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);
  const [picking, setPicking] = useState<"from" | "to" | null>(null);
  const [exporting, setExporting] = useState(false);

  const data = report(transactions, accounts, categories, from, to);
  const money = (n: number) => formatMoney(n, baseCurrency);

  const onExport = async () => {
    setExporting(true);
    const err = await exportReportPdf(data, {
      userName: name ?? email ?? "Kharcha user",
      from,
      to,
      currency: baseCurrency,
    });
    setExporting(false);
    if (err) Alert.alert("Export failed", err);
  };

  return (
    <Screen scroll>
      <View style={styles.rangeRow}>
        <RangeField label="From" value={from} onPress={() => setPicking("from")} />
        <RangeField label="To" value={to} onPress={() => setPicking("to")} />
      </View>

      {picking ? (
        <DateTimePicker
          value={picking === "from" ? from : to}
          mode="date"
          onChange={(_e, d) => {
            const which = picking;
            setPicking(Platform.OS === "ios" ? which : null);
            if (d) (which === "from" ? setFrom : setTo)(d);
          }}
        />
      ) : null}

      <Card>
        <View style={styles.totalRow}>
          <View style={styles.legendLeft}>
            <View style={[styles.dot, { backgroundColor: colors.income }]} />
            <Text style={styles.muted}>Income</Text>
          </View>
          <Text style={[styles.amt, { color: colors.income }]}>
            {money(data.totals.income)}
          </Text>
        </View>
        <View style={styles.totalRow}>
          <View style={styles.legendLeft}>
            <View style={[styles.dot, { backgroundColor: colors.danger }]} />
            <Text style={styles.muted}>Expense</Text>
          </View>
          <Text style={[styles.amt, { color: colors.danger }]}>
            {money(data.totals.expense)}
          </Text>
        </View>
        <View style={[styles.totalRow, styles.net]}>
          <Text style={styles.netLabel}>Net</Text>
          <Text
            style={[
              styles.netAmt,
              { color: data.totals.net >= 0 ? colors.income : colors.danger },
            ]}
          >
            {money(data.totals.net)}
          </Text>
        </View>
      </Card>

      <SectionTitle>By category</SectionTitle>
      {data.byCategory.length === 0 ? (
        <Card>
          <Text style={styles.muted}>No activity in this range.</Text>
        </Card>
      ) : (
        <RowGroup>
          {data.byCategory.map((c, i) => (
            <ListRow
              key={c.name}
              last={i === data.byCategory.length - 1}
              title={c.name}
              right={
                <Text style={styles.lineVal}>{money(c.expense || c.income)}</Text>
              }
            />
          ))}
        </RowGroup>
      )}

      <SectionTitle>By account</SectionTitle>
      <RowGroup>
        {data.byAccount.map((a, i) => {
          const net = a.income - a.expense;
          return (
            <ListRow
              key={a.name}
              last={i === data.byAccount.length - 1}
              title={a.name}
              right={
                <Text
                  style={[
                    styles.lineVal,
                    { color: net < 0 ? colors.danger : colors.text },
                  ]}
                >
                  {money(net)}
                </Text>
              }
            />
          );
        })}
      </RowGroup>

      <View style={{ marginTop: 8 }}>
        <Button
          label={exporting ? "Preparing PDF…" : "Export PDF"}
          icon="download-outline"
          onPress={onExport}
          disabled={exporting}
        />
      </View>
    </Screen>
  );
}

function RangeField({
  label,
  value,
  onPress,
}: {
  label: string;
  value: Date;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.rangeField} onPress={onPress}>
      <Text style={styles.rangeLabel}>{label}</Text>
      <View style={styles.rangeValueRow}>
        <Ionicons name="calendar-outline" size={16} color={colors.muted} />
        <Text style={styles.rangeValue}>{format(value, "MMM d, yyyy")}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  rangeRow: { flexDirection: "row", gap: 12 },
  rangeField: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: 12,
    gap: 6,
  },
  rangeLabel: { fontSize: 12, color: colors.muted, fontWeight: "600" },
  rangeValueRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  rangeValue: { fontSize: 15, fontWeight: "600", color: colors.text },

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
  lineVal: { color: colors.text, fontWeight: "600", fontSize: 15, ...moneyFont },
});
