import { useState } from "react";
import { FlatList, Text } from "react-native";
import { useRouter } from "expo-router";
import { format } from "date-fns";
import { useLocalData } from "@/lib/use-data";
import { listLocalTransactions, type TxFilter } from "@/lib/local-queries";
import { signedMoney } from "@/lib/money";
import {
  Screen,
  Button,
  Segmented,
  ListRow,
  EmptyState,
  colors,
} from "@/lib/ui";

type FilterType = "ALL" | "INCOME" | "EXPENSE" | "TRANSFER";

const amountColor = (type: string) =>
  type === "INCOME"
    ? colors.income
    : type === "EXPENSE"
      ? colors.danger
      : colors.muted;

export default function TransactionsScreen() {
  const router = useRouter();
  const { ready, accounts, categories, transactions } = useLocalData();
  const [type, setType] = useState<FilterType>("ALL");

  const filter: TxFilter = type === "ALL" ? {} : { type };
  const rows = listLocalTransactions(transactions, accounts, categories, filter);

  return (
    <Screen>
      <Button
        label="+ Add transaction"
        onPress={() => router.push("/transaction-form")}
      />
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
      <FlatList
        data={rows}
        keyExtractor={(t) => t.id}
        ListEmptyComponent={
          ready ? <EmptyState message="No transactions yet." /> : null
        }
        renderItem={({ item }) => (
          <ListRow
            title={
              item.type === "TRANSFER"
                ? `${item.account} → ${item.toAccount ?? "?"}`
                : (item.category ?? "Uncategorized")
            }
            subtitle={`${item.account} · ${format(new Date(item.date), "MMM d, yyyy")}`}
            right={
              <Text style={{ fontSize: 16, fontWeight: "600", color: amountColor(item.type) }}>
                {signedMoney(item.amount, item.type, item.currency)}
              </Text>
            }
            onPress={() =>
              router.push({
                pathname: "/transaction-form",
                params: { id: item.id },
              })
            }
          />
        )}
      />
    </Screen>
  );
}
