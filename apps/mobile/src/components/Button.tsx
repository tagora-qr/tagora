/**
 * Tagora Button — primary / secondary / ghost variants.
 */
import { Pressable, Text, StyleSheet, ActivityIndicator, type PressableProps } from "react-native";
import { colors, radius, spacing, typography } from "@/lib/theme";

interface Props extends Omit<PressableProps, "children"> {
  label: string;
  variant?: "primary" | "secondary" | "ghost" | "accent";
  size?: "md" | "lg";
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

export function Button({
  label,
  variant = "primary",
  size = "md",
  loading = false,
  fullWidth = false,
  icon,
  disabled,
  style,
  ...rest
}: Props) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        size === "lg" ? styles.lg : styles.md,
        variant === "primary" && styles.primary,
        variant === "secondary" && styles.secondary,
        variant === "ghost" && styles.ghost,
        variant === "accent" && styles.accent,
        fullWidth && styles.fullWidth,
        isDisabled && { opacity: 0.5 },
        pressed && !isDisabled && { transform: [{ scale: 0.98 }] },
        typeof style === "function" ? style({ pressed }) : style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "primary" || variant === "accent" ? "#FFF" : colors.navy}
        />
      ) : (
        <>
          {icon}
          <Text
            style={[
              styles.label,
              variant === "primary" && { color: "#FFFFFF" },
              variant === "secondary" && { color: colors.navy },
              variant === "ghost" && { color: colors.navy },
              variant === "accent" && { color: colors.navy },
            ]}
          >
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderRadius: radius.md,
  },
  md: { paddingVertical: 12, paddingHorizontal: 18 },
  lg: { paddingVertical: 16, paddingHorizontal: 22 },
  primary: { backgroundColor: colors.navy },
  secondary: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.navyBorder,
  },
  ghost: { backgroundColor: "transparent" },
  accent: { backgroundColor: colors.accent },
  fullWidth: { alignSelf: "stretch" },
  label: { ...typography.bodyBold },
});
