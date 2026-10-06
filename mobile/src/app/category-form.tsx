import { useEffect, useState } from "react";
import { Alert, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useLocalData } from "@/lib/use-data";
import { saveCategory, deleteCategory } from "@/lib/sync/local-writes";
import { categoryKinds } from "@/lib/schemas";
import { Screen, TextField, Segmented, Button } from "@/lib/ui";

type Kind = (typeof categoryKinds)[number];

export default function CategoryForm() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { categories } = useLocalData();
  const existing = id ? categories.find((c) => c.id === id) : undefined;

  const [name, setName] = useState("");
  const [kind, setKind] = useState<Kind>("EXPENSE");
  const [color, setColor] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (existing && !loaded) {
      setName(existing.name);
      setKind(existing.kind);
      setColor(existing.color ?? "");
      setLoaded(true);
    }
  }, [existing, loaded]);

  const onSave = async () => {
    setError(null);
    const res = await saveCategory({ id, name, kind, color });
    if (res.ok) router.back();
    else setError(res.error);
  };

  const onDelete = () => {
    if (!id) return;
    Alert.alert(
      "Delete category",
      "Transactions keep their record but lose this category.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteCategory(id);
            router.back();
          },
        },
      ],
    );
  };

  return (
    <Screen scroll>
      <TextField
        label="Name"
        value={name}
        onChangeText={setName}
        placeholder="e.g. Groceries"
        error={error}
      />
      <Segmented
        label="Kind"
        value={kind}
        onChange={setKind}
        options={categoryKinds.map((k) => ({ value: k, label: k }))}
      />
      <TextField
        label="Color (optional hex)"
        value={color}
        onChangeText={setColor}
        placeholder="#2563eb"
        autoCapitalize="none"
      />

      <View style={{ gap: 10, marginTop: 8 }}>
        <Button label={id ? "Save changes" : "Create category"} onPress={onSave} />
        {id ? (
          <Button label="Delete" variant="danger" onPress={onDelete} />
        ) : null}
      </View>
    </Screen>
  );
}
