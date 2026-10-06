import { FlatList, Text } from "react-native";
import { useRouter } from "expo-router";
import { useLocalData } from "@/lib/use-data";
import { accountsWithBalances } from "@/lib/local-queries";
import { formatMoney } from "@/lib/money";
import { Screen, Button, ListRow, EmptyState, colors } from "@/lib/ui";

export default function AccountsScreen() {
  const router = useRouter();
  const { ready, accounts, transactions } = useLocalData();
  const rows = accountsWithBalances(accounts, transactions);

  return (
    <Screen>
      <Button label="+ Add account" onPress={() => router.push("/account-form")} />
      <FlatList
        style={{ marginTop: 12 }}
        data={rows}
        keyExtractor={(a) => a.id}
        ListEmptyComponent={
          ready ? <EmptyState message="No accounts yet." /> : null
        }
        renderItem={({ item }) => (
          <ListRow
            title={item.archived ? `${item.name} (archived)` : item.name}
            subtitle={`${item.type} · ${item.currency}`}
            right={
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: item.balance < 0 ? colors.danger : colors.text,
                }}
              >
                {formatMoney(item.balance, item.currency)}
              </Text>
            }
            onPress={() =>
              router.push({
                pathname: "/account-form",
                params: { id: item.id },
              })
            }
          />
        )}
      />
    </Screen>
  );
}
