import { useState } from "react";
import { Alert, Platform, StyleSheet, Text, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { format } from "date-fns";
import { useLocalData } from "@/lib/use-data";
import { report } from "@/lib/local-queries";
import { monthRange } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { exportReportPdf } from "@/lib/report-pdf";
import { Screen, Card, Button, colors } from "@/lib/ui";

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
        <View style={styles.rangeItem}>
          <Text style={styles.label}>From</Text>
          <Button
            label={format(from, "PP")}
            variant="outline"
            onPress={() => setPicking("from")}
          />
        </View>
        <View style={styles.rangeItem}>
          <Text style={styles.label}>To</Text>
          <Button
            label={format(to, "PP")}
            variant="outline"
            onPress={() => setPicking("to")}
          />
        </View>
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
          <Text style={styles.muted}>Income</Text>
          <Text style={{ color: colors.income, fontWeight: "600" }}>
            {money(data.totals.income)}
          </Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.muted}>Expense</Text>
          <Text style={{ color: colors.danger, fontWeight: "600" }}>
            {money(data.totals.expense)}
          </Text>
        </View>
        <View style={[styles.totalRow, styles.net]}>
          <Text style={{ fontWeight: "700" }}>Net</Text>
          <Text style={{ fontWeight: "700" }}>{money(data.totals.net)}</Text>
        </View>
      </Card>

      <Section title="By category">
        {data.byCategory.length === 0 ? (
          <Text style={styles.muted}>No activity in this range.</Text>
        ) : (
          data.byCategory.map((c) => (
            <View key={c.name} style={styles.line}>
              <Text style={styles.lineName}>{c.name}</Text>
              <Text style={styles.lineVal}>{money(c.expense || c.income)}</Text>
            </View>
          ))
        )}
      </Section>

      <Section title="By account">
        {data.byAccount.map((a) => (
          <View key={a.name} style={styles.line}>
            <Text style={styles.lineName}>{a.name}</Text>
            <Text style={styles.lineVal}>
              {money(a.income - a.expense)}
            </Text>
          </View>
        ))}
      </Section>

      <Button
        label={exporting ? "Preparing PDF…" : "Export PDF"}
        onPress={onExport}
        disabled={exporting}
      />
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  rangeRow: { flexDirection: "row", gap: 12 },
  rangeItem: { flex: 1, gap: 6 },
  label: { fontSize: 13, color: colors.muted, fontWeight: "500" },
  muted: { color: colors.muted },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  net: { borderTopWidth: 1, borderTopColor: colors.border, marginTop: 4, paddingTop: 10 },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginTop: 4 },
  line: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  lineName: { color: colors.text },
  lineVal: { color: colors.text, fontWeight: "500" },
});
