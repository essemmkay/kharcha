import { useEffect, useState } from "react";
import { Alert, Platform, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import { format } from "date-fns";
import { useLocalData } from "@/lib/use-data";
import { saveTransaction, deleteTransaction } from "@/lib/sync/local-writes";
import { formOptions } from "@/lib/local-queries";
import { transactionTypes } from "@/lib/schemas";
import { Screen, TextField, Segmented, ChipPicker, Button, colors } from "@/lib/ui";

type TxType = (typeof transactionTypes)[number];

export default function TransactionForm() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { accounts, categories, transactions } = useLocalData();
  const existing = id ? transactions.find((t) => t.id === id) : undefined;
  const options = formOptions(accounts, categories);

  const [type, setType] = useState<TxType>("EXPENSE");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [toAccountId, setToAccountId] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (existing && !loaded) {
      setType(existing.type);
      setAmount(String(existing.amount));
      setDate(new Date(existing.date));
      setAccountId(existing.accountId);
      setToAccountId(existing.toAccountId);
      setCategoryId(existing.categoryId);
      setNote(existing.note ?? "");
      setLoaded(true);
    }
  }, [existing, loaded]);

  const onSave = async () => {
    setError(null);
    const res = await saveTransaction({
      id,
      type,
      amount,
      date,
      accountId: accountId ?? "",
      note,
      tags: [],
      ...(type === "TRANSFER"
        ? { toAccountId: toAccountId ?? "" }
        : { categoryId: categoryId ?? "" }),
    });
    if (res.ok) router.back();
    else setError(res.error);
  };

  const onDelete = () => {
    if (!id) return;
    Alert.alert("Delete transaction", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteTransaction(id);
          router.back();
        },
      },
    ]);
  };

  const catOptions = type === "TRANSFER" ? [] : options.categories[type];

  return (
    <Screen scroll>
      <Segmented
        label="Type"
        value={type}
        onChange={setType}
        options={transactionTypes.map((t) => ({ value: t, label: t }))}
      />
      <TextField
        label="Amount"
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
        placeholder="0.00"
      />

      <View style={{ gap: 6 }}>
        <Text style={{ fontSize: 13, color: colors.muted, fontWeight: "500" }}>
          Date
        </Text>
        <Button
          label={format(date, "PP")}
          variant="outline"
          onPress={() => setShowPicker(true)}
        />
        {showPicker ? (
          <DateTimePicker
            value={date}
            mode="date"
            onChange={(_e, d) => {
              setShowPicker(Platform.OS === "ios");
              if (d) setDate(d);
            }}
          />
        ) : null}
      </View>

      <ChipPicker
        label={type === "TRANSFER" ? "From account" : "Account"}
        value={accountId}
        options={options.accounts}
        onChange={setAccountId}
      />

      {type === "TRANSFER" ? (
        <ChipPicker
          label="To account"
          value={toAccountId}
          options={options.accounts.filter((a) => a.id !== accountId)}
          onChange={setToAccountId}
        />
      ) : (
        <ChipPicker
          label="Category"
          value={categoryId}
          options={catOptions}
          onChange={setCategoryId}
        />
      )}

      <TextField
        label="Note (optional)"
        value={note}
        onChangeText={setNote}
        multiline
      />

      {error ? (
        <Text style={{ color: colors.danger, fontSize: 14 }}>{error}</Text>
      ) : null}

      <View style={{ gap: 10, marginTop: 8 }}>
        <Button label={id ? "Save changes" : "Add transaction"} onPress={onSave} />
        {id ? (
          <Button label="Delete" variant="danger" onPress={onDelete} />
        ) : null}
      </View>
    </Screen>
  );
}
