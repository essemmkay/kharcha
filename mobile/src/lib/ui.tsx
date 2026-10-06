import { type ReactNode } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Small shared UI kit so screens stay thin and consistent. Deliberately plain
// StyleSheet (no design-system dependency) for a single-user app.
export const colors = {
  primary: "#2563eb",
  danger: "#dc2626",
  income: "#16a34a",
  text: "#111827",
  muted: "#6b7280",
  border: "#e5e7eb",
  bg: "#ffffff",
  subtle: "#f9fafb",
};

export function Screen({
  children,
  scroll = false,
}: {
  children: ReactNode;
  scroll?: boolean;
}) {
  if (scroll) {
    return (
      <SafeAreaView style={styles.flex} edges={["bottom"]}>
        <ScrollView contentContainerStyle={styles.scroll}>{children}</ScrollView>
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView style={[styles.flex, styles.pad]} edges={["bottom"]}>
      {children}
    </SafeAreaView>
  );
}

export function Card({ children }: { children: ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

export function Button({
  label,
  onPress,
  variant = "primary",
  disabled,
}: {
  label: string;
  onPress: () => void;
  variant?: "primary" | "outline" | "danger";
  disabled?: boolean;
}) {
  const v = styles[variant];
  const t = variant === "primary" ? styles.btnTextLight : styles.btnTextDark;
  return (
    <TouchableOpacity
      style={[styles.btn, v, disabled && styles.btnDisabled]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={[t, variant === "danger" && { color: colors.danger }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export function TextField({
  label,
  error,
  ...props
}: { label: string; error?: string | null } & TextInputProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, error && styles.inputError]}
        placeholderTextColor={colors.muted}
        {...props}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label?: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <View style={styles.field}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.segment}>
        {options.map((o) => {
          const active = o.value === value;
          return (
            <TouchableOpacity
              key={o.value}
              style={[styles.segmentItem, active && styles.segmentItemActive]}
              onPress={() => onChange(o.value)}
            >
              <Text style={active ? styles.segmentTextActive : styles.segmentText}>
                {o.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// Horizontal chip picker for choosing one option (accounts, categories).
export function ChipPicker({
  label,
  value,
  options,
  onChange,
  error,
}: {
  label: string;
  value: string | null;
  options: { id: string; name: string }[];
  onChange: (id: string) => void;
  error?: string | null;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.chipRow}>
          {options.length === 0 ? (
            <Text style={styles.muted}>None yet</Text>
          ) : (
            options.map((o) => {
              const active = o.id === value;
              return (
                <TouchableOpacity
                  key={o.id}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => onChange(o.id)}
                >
                  <Text style={active ? styles.chipTextActive : styles.chipText}>
                    {o.name}
                  </Text>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

export function ListRow({
  title,
  subtitle,
  right,
  onPress,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} disabled={!onPress}>
      <View style={styles.flex}>
        <Text style={styles.rowTitle}>{title}</Text>
        {subtitle ? <Text style={styles.rowSubtitle}>{subtitle}</Text> : null}
      </View>
      {right}
    </TouchableOpacity>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.muted}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  pad: { padding: 16 },
  scroll: { padding: 16, gap: 12 },
  card: {
    backgroundColor: colors.subtle,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  btn: { borderRadius: 10, paddingVertical: 14, alignItems: "center" },
  primary: { backgroundColor: colors.primary },
  outline: { borderWidth: 1, borderColor: colors.border },
  danger: { borderWidth: 1, borderColor: colors.danger },
  btnDisabled: { opacity: 0.5 },
  btnTextLight: { color: "#fff", fontSize: 16, fontWeight: "600" },
  btnTextDark: { color: colors.text, fontSize: 16, fontWeight: "600" },
  field: { gap: 6 },
  label: { fontSize: 13, color: colors.muted, fontWeight: "500" },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
  },
  inputError: { borderColor: colors.danger },
  errorText: { color: colors.danger, fontSize: 13 },
  muted: { color: colors.muted, fontSize: 14 },
  segment: {
    flexDirection: "row",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  segmentItem: { flex: 1, paddingVertical: 10, alignItems: "center" },
  segmentItemActive: { backgroundColor: colors.primary },
  segmentText: { color: colors.text, fontWeight: "500" },
  segmentTextActive: { color: "#fff", fontWeight: "600" },
  chipRow: { flexDirection: "row", gap: 8, paddingVertical: 2 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text },
  chipTextActive: { color: "#fff", fontWeight: "600" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 12,
  },
  rowTitle: { fontSize: 16, color: colors.text, fontWeight: "500" },
  rowSubtitle: { fontSize: 13, color: colors.muted, marginTop: 2 },
  empty: { paddingVertical: 40, alignItems: "center" },
});
