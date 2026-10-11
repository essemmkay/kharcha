import { type ReactNode, useEffect, useState } from "react";
import {
  Appearance,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View,
  type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { bankBySlug } from "@/lib/pk-banks";

// Shared UI kit + design tokens. Calm premium-fintech direction: soft surfaces,
// one indigo accent, mint/rose money semantics, adaptive light + dark.
// ponytail: palette resolved once at launch from the system scheme (restart to
// re-theme). Single-user app; live scheme switching isn't worth threading a
// context through every StyleSheet block.
const isDark = (Appearance.getColorScheme() ?? "light") === "dark";

const light = {
  bg: "#F4F5FA",
  surface: "#FFFFFF",
  subtle: "#EEF0F7", // surfaceAlt (kept name for back-compat)
  text: "#101828",
  muted: "#667085",
  faint: "#98A2B3",
  border: "#E7E9F1",
  primary: "#4F46E5",
  primaryText: "#FFFFFF",
  primarySoft: "#ECECFE",
  income: "#047857",
  danger: "#DC2626",
  dangerSoft: "#FDECEC",
  tabBar: "#FFFFFF",
  ink: "#14162A", // deep "black-card" hero surface
  inkBorder: "transparent",
};

const dark = {
  bg: "#0A0F1C",
  surface: "#141B2B",
  subtle: "#1C2638",
  text: "#F8FAFC",
  muted: "#94A3B8",
  faint: "#64748B",
  border: "#232E42",
  primary: "#818CF8",
  primaryText: "#0A0F1C",
  primarySoft: "#1E2540",
  income: "#34D399",
  danger: "#F87171",
  dangerSoft: "#3A1E22",
  tabBar: "#0C1322",
  ink: "#1B2138", // elevated above the dark page, with a hairline to separate
  inkBorder: "rgba(255,255,255,0.08)",
};

export const colors = isDark ? dark : light;

export const radius = { md: 12, lg: 16, xl: 22, pill: 999 };
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 };

// Soft elevation. Dark mode leans on borders (shadows barely render), so keep
// it light there.
export const shadow: ViewStyle = Platform.select({
  ios: {
    shadowColor: "#0B1120",
    shadowOpacity: isDark ? 0.5 : 0.07,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
  },
  default: { elevation: isDark ? 0 : 3 },
}) as ViewStyle;

// Tabular figures so money columns stay aligned and don't jitter.
export const moneyFont = { fontVariant: ["tabular-nums" as const] };

type IoniconName = keyof typeof Ionicons.glyphMap;

export function Screen({
  children,
  scroll = false,
  style,
}: {
  children: ReactNode;
  scroll?: boolean;
  style?: ViewStyle;
}) {
  if (scroll) {
    return (
      <SafeAreaView style={styles.flex} edges={["bottom"]}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={[styles.scroll, style]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView style={[styles.flex, styles.pad, style]} edges={["bottom"]}>
      {children}
    </SafeAreaView>
  );
}

export function Card({
  children,
  onPress,
  style,
}: {
  children: ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
}) {
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.card, style, pressed && styles.pressed]}
      >
        {children}
      </Pressable>
    );
  }
  return <View style={[styles.card, style]}>{children}</View>;
}

export function SectionTitle({
  children,
  right,
}: {
  children: ReactNode;
  right?: ReactNode;
}) {
  return (
    <View style={styles.sectionTitleRow}>
      <Text style={styles.sectionTitle}>{children}</Text>
      {right}
    </View>
  );
}

export function Button({
  label,
  onPress,
  variant = "primary",
  disabled,
  icon,
}: {
  label: string;
  onPress: () => void;
  variant?: "primary" | "outline" | "danger" | "ghost";
  disabled?: boolean;
  icon?: IoniconName;
}) {
  const fill = variant === "primary";
  const tint =
    variant === "primary"
      ? colors.primaryText
      : variant === "danger"
        ? colors.danger
        : colors.text;
  return (
    <Pressable
      style={({ pressed }) => [
        styles.btn,
        styles[`btn_${variant}`],
        disabled && styles.btnDisabled,
        pressed && !disabled && styles.pressed,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      {icon ? <Ionicons name={icon} size={18} color={tint} /> : null}
      <Text style={[styles.btnText, { color: tint }, fill && styles.btnTextBold]}>
        {label}
      </Text>
    </Pressable>
  );
}

export function TextField({
  label,
  error,
  ...props
}: { label: string; error?: string | null } & TextInputProps) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          props.multiline && styles.inputMultiline,
          focused && styles.inputFocused,
          error && styles.inputError,
        ]}
        placeholderTextColor={colors.faint}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
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
            <Pressable
              key={o.value}
              style={[styles.segmentItem, active && styles.segmentItemActive]}
              onPress={() => onChange(o.value)}
            >
              <Text style={active ? styles.segmentTextActive : styles.segmentText}>
                {o.label}
              </Text>
            </Pressable>
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
  options: { id: string; name: string; color?: string | null }[];
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
                <Pressable
                  key={o.id}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => onChange(o.id)}
                >
                  {o.color ? (
                    <View style={[styles.chipDot, { backgroundColor: o.color }]} />
                  ) : null}
                  <Text style={active ? styles.chipTextActive : styles.chipText}>
                    {o.name}
                  </Text>
                </Pressable>
              );
            })
          )}
        </View>
      </ScrollView>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

// Round leading icon for list rows.
export function Avatar({
  icon,
  color = colors.primary,
}: {
  icon: IoniconName;
  color?: string;
}) {
  return (
    <View style={[styles.avatar, { backgroundColor: tint(color) }]}>
      <Ionicons name={icon} size={18} color={color} />
    </View>
  );
}

// Monogram palette for the local fallback badge.
const MONO = [
  "#4F46E5", "#0891B2", "#059669", "#D97706",
  "#DB2777", "#7C3AED", "#2563EB", "#EA580C",
];

function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

function monoColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return MONO[h % MONO.length];
}

const ACCOUNT_TYPE_ICON: Record<string, IoniconName> = {
  CASH: "cash-outline",
  ASSET: "trending-up-outline",
};

// Keyless favicon sources for a bank domain, tried in order. Clearbit's free
// logo endpoint is discontinued; these two cover most Pakistani banks and a
// miss cleanly falls through to the monogram.
function logoSources(domain: string): string[] {
  return [
    `https://icons.duckduckgo.com/ip3/${domain}.ico`,
    `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
  ];
}

// Account image: the linked Pakistani bank's logo (favicon services, disk-
// cached), falling back through the sources to a local monogram; cash/asset
// accounts and unlinked banks show a type icon or monogram.
// ponytail: the logo request sends the bank's domain to a third-party service —
// the user opted into this over a fully-local monogram.
export function AccountAvatar({
  name,
  type,
  bankSlug,
}: {
  name: string;
  type: string;
  bankSlug?: string | null;
}) {
  const bank = bankBySlug(bankSlug);
  const sources = bank ? logoSources(bank.domain) : [];
  const [idx, setIdx] = useState(0);
  // Reset to the first source when the linked bank changes (e.g. after editing).
  useEffect(() => setIdx(0), [bank?.domain]);

  if (bank && idx < sources.length) {
    return (
      <View style={styles.logoChip}>
        <Image
          key={sources[idx]}
          source={{ uri: sources[idx] }}
          style={styles.logoImg}
          contentFit="contain"
          cachePolicy="disk"
          transition={120}
          onError={() => setIdx((i) => i + 1)}
        />
      </View>
    );
  }
  if (type !== "BANK") {
    return <Avatar icon={ACCOUNT_TYPE_ICON[type] ?? "wallet-outline"} />;
  }
  return (
    <View style={[styles.avatar, { backgroundColor: monoColor(name) }]}>
      <Text style={styles.monogram}>{initials(name)}</Text>
    </View>
  );
}

export function ListRow({
  title,
  subtitle,
  right,
  onPress,
  left,
  last,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  onPress?: () => void;
  left?: ReactNode;
  last?: boolean;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.row,
        last && styles.rowLast,
        pressed && onPress && styles.rowPressed,
      ]}
      onPress={onPress}
      disabled={!onPress}
    >
      {left}
      <View style={styles.flex}>
        <Text style={styles.rowTitle} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.rowSubtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right}
    </Pressable>
  );
}

// A card that wraps list rows with dividers between them (no divider after the
// last). Children should be <ListRow> with `last` on the final one.
export function RowGroup({ children }: { children: ReactNode }) {
  return <View style={styles.rowGroup}>{children}</View>;
}

export function Badge({ label, tone = "muted" }: { label: string; tone?: "muted" | "primary" }) {
  return (
    <View style={[styles.badge, tone === "primary" && styles.badgePrimary]}>
      <Text style={[styles.badgeText, tone === "primary" && styles.badgeTextPrimary]}>
        {label}
      </Text>
    </View>
  );
}

export function EmptyState({
  message,
  title,
  icon = "file-tray-outline",
}: {
  message: string;
  title?: string;
  icon?: IoniconName;
}) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Ionicons name={icon} size={30} color={colors.faint} />
      </View>
      {title ? <Text style={styles.emptyTitle}>{title}</Text> : null}
      <Text style={styles.emptyMsg}>{message}</Text>
    </View>
  );
}

// Floating action button, pinned bottom-right above the tab bar.
export function FAB({
  onPress,
  icon = "add",
  label,
}: {
  onPress: () => void;
  icon?: IoniconName;
  label?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.fab, pressed && styles.pressed]}
      hitSlop={8}
    >
      <Ionicons name={icon} size={24} color={colors.primaryText} />
      {label ? <Text style={styles.fabLabel}>{label}</Text> : null}
    </Pressable>
  );
}

// 12%-opacity wash of a color for soft icon backgrounds, derived from the hex.
function tint(hex: string): string {
  const h = hex.replace("#", "");
  if (h.length !== 6) return isDark ? "#1C2638" : "#EEF0F7";
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${isDark ? 0.22 : 0.12})`;
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  pad: { padding: space.lg },
  scroll: { padding: space.lg, gap: space.md, paddingBottom: 40 },
  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: space.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    ...shadow,
  },

  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: space.sm,
    marginBottom: 2,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: colors.muted,
  },

  btn: {
    borderRadius: radius.md,
    paddingVertical: 15,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  btn_primary: { backgroundColor: colors.primary, ...shadow },
  btn_outline: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  btn_danger: { borderWidth: 1, borderColor: colors.danger, backgroundColor: colors.dangerSoft },
  btn_ghost: { backgroundColor: "transparent" },
  btnDisabled: { opacity: 0.45 },
  btnText: { fontSize: 15, fontWeight: "600" },
  btnTextBold: { fontWeight: "700" },

  field: { gap: 7 },
  label: {
    fontSize: 13,
    color: colors.muted,
    fontWeight: "600",
  },
  input: {
    backgroundColor: colors.subtle,
    borderWidth: 1,
    borderColor: "transparent",
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 16,
    color: colors.text,
  },
  inputMultiline: { minHeight: 76, textAlignVertical: "top" },
  inputFocused: { borderColor: colors.primary, backgroundColor: colors.surface },
  inputError: { borderColor: colors.danger },
  errorText: { color: colors.danger, fontSize: 13, fontWeight: "500" },
  muted: { color: colors.muted, fontSize: 14 },

  segment: {
    flexDirection: "row",
    borderRadius: radius.md,
    backgroundColor: colors.subtle,
    padding: 4,
    gap: 4,
  },
  segmentItem: {
    flex: 1,
    paddingVertical: 9,
    alignItems: "center",
    borderRadius: radius.md - 4,
  },
  segmentItemActive: { backgroundColor: colors.surface, ...shadow },
  segmentText: { color: colors.muted, fontWeight: "600", fontSize: 14 },
  segmentTextActive: { color: colors.text, fontWeight: "700", fontSize: 14 },

  chipRow: { flexDirection: "row", gap: 8, paddingVertical: 2 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 15,
    paddingVertical: 9,
    borderRadius: radius.pill,
    backgroundColor: colors.subtle,
    borderWidth: 1,
    borderColor: "transparent",
  },
  chipActive: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  chipDot: { width: 9, height: 9, borderRadius: 5 },
  chipText: { color: colors.muted, fontWeight: "600" },
  chipTextActive: { color: colors.primary, fontWeight: "700" },

  avatar: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  monogram: { color: "#fff", fontWeight: "800", fontSize: 14 },
  logoChip: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: "#FFFFFF",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  logoImg: { width: 28, height: 28 },

  rowGroup: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: "hidden",
    ...shadow,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    gap: 12,
    minHeight: 60,
  },
  rowLast: { borderBottomWidth: 0 },
  rowPressed: { backgroundColor: colors.subtle },
  rowTitle: { fontSize: 15, color: colors.text, fontWeight: "600" },
  rowSubtitle: { fontSize: 13, color: colors.muted, marginTop: 2 },

  badge: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: colors.subtle,
    alignSelf: "flex-start",
  },
  badgePrimary: { backgroundColor: colors.primarySoft },
  badgeText: { fontSize: 11, fontWeight: "700", color: colors.muted, letterSpacing: 0.3 },
  badgeTextPrimary: { color: colors.primary },

  empty: { paddingVertical: 48, alignItems: "center", gap: 10 },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    backgroundColor: colors.subtle,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: colors.text },
  emptyMsg: { color: colors.muted, fontSize: 14, textAlign: "center" },

  fab: {
    position: "absolute",
    right: space.lg,
    bottom: space.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: 56,
    paddingHorizontal: 18,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.4,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  fabLabel: { color: colors.primaryText, fontWeight: "700", fontSize: 15 },
});
