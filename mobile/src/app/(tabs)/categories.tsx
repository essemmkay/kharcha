import { FlatList, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useLocalData } from "@/lib/use-data";
import { Screen, Button, ListRow, EmptyState, colors } from "@/lib/ui";

export default function CategoriesScreen() {
  const router = useRouter();
  const { ready, categories } = useLocalData();
  const rows = categories
    .filter((c) => !c.deletedAt && !c.archived)
    .sort(
      (a, b) => a.kind.localeCompare(b.kind) || a.name.localeCompare(b.name),
    );

  return (
    <Screen>
      <Button
        label="+ Add category"
        onPress={() => router.push("/category-form")}
      />
      <FlatList
        style={{ marginTop: 12 }}
        data={rows}
        keyExtractor={(c) => c.id}
        ListEmptyComponent={
          ready ? <EmptyState message="No categories yet." /> : null
        }
        renderItem={({ item }) => (
          <ListRow
            title={item.name}
            subtitle={item.kind}
            right={
              item.color ? (
                <View
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: 8,
                    backgroundColor: item.color,
                  }}
                />
              ) : (
                <Text style={{ color: colors.muted }}>›</Text>
              )
            }
            onPress={() =>
              router.push({
                pathname: "/category-form",
                params: { id: item.id },
              })
            }
          />
        )}
      />
    </Screen>
  );
}
