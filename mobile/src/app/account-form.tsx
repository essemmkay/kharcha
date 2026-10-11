import { useEffect, useState } from "react";
import { Alert, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useLocalData } from "@/lib/use-data";
import {
  saveAccount,
  setAccountArchived,
  deleteAccount,
} from "@/lib/sync/local-writes";
import { setBankLink } from "@/lib/db";
import { PK_BANKS } from "@/lib/pk-banks";
import { accountTypes } from "@/lib/schemas";
import { Screen, TextField, Segmented, ChipPicker, Button } from "@/lib/ui";

const BANK_OPTIONS = [
  { id: "", name: "None" },
  ...PK_BANKS.map((b) => ({ id: b.slug, name: b.name })),
];

type AccountType = (typeof accountTypes)[number];

export default function AccountForm() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { accounts, bankLinks } = useLocalData();
  const existing = id ? accounts.find((a) => a.id === id) : undefined;

  const [name, setName] = useState("");
  const [type, setType] = useState<AccountType>("BANK");
  const [currency, setCurrency] = useState("USD");
  const [openingBalance, setOpeningBalance] = useState("0");
  const [note, setNote] = useState("");
  const [bankSlug, setBankSlug] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Prefill once the account row loads (edit mode).
  useEffect(() => {
    if (existing && !loaded) {
      setName(existing.name);
      setType(existing.type);
      setCurrency(existing.currency);
      setOpeningBalance(String(existing.openingBalance));
      setNote(existing.note ?? "");
      setBankSlug(bankLinks[existing.id] ?? null);
      setLoaded(true);
    }
  }, [existing, loaded, bankLinks]);

  const onSave = async () => {
    setError(null);
    const res = await saveAccount({
      id,
      name,
      type,
      currency,
      openingBalance,
      note,
    });
    if (!res.ok) {
      setError(res.error);
      return;
    }
    // Bank link is device-local (not synced); only BANK accounts keep one.
    await setBankLink(res.data.id, type === "BANK" ? bankSlug : null);
    router.back();
  };

  const onArchive = async () => {
    if (!id || !existing) return;
    await setAccountArchived(id, !existing.archived);
    router.back();
  };

  const onDelete = () => {
    if (!id) return;
    Alert.alert(
      "Delete account",
      "This also deletes its transactions. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteAccount(id);
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
        placeholder="e.g. Checking"
        error={error}
      />
      <Segmented
        label="Type"
        value={type}
        onChange={setType}
        options={accountTypes.map((t) => ({ value: t, label: t }))}
      />
      {type === "BANK" ? (
        <ChipPicker
          label="Bank (for logo)"
          value={bankSlug ?? ""}
          options={BANK_OPTIONS}
          onChange={(v) => setBankSlug(v || null)}
        />
      ) : null}
      <TextField
        label="Currency"
        value={currency}
        onChangeText={setCurrency}
        autoCapitalize="characters"
        maxLength={3}
      />
      <TextField
        label="Opening balance"
        value={openingBalance}
        onChangeText={setOpeningBalance}
        keyboardType="numeric"
      />
      <TextField
        label="Note (optional)"
        value={note}
        onChangeText={setNote}
        multiline
      />

      <View style={{ gap: 10, marginTop: 8 }}>
        <Button label={id ? "Save changes" : "Create account"} onPress={onSave} />
        {existing ? (
          <Button
            label={existing.archived ? "Unarchive" : "Archive"}
            variant="outline"
            onPress={onArchive}
          />
        ) : null}
        {id ? (
          <Button label="Delete" variant="danger" onPress={onDelete} />
        ) : null}
      </View>
    </Screen>
  );
}
