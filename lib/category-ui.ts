import { categoryConfig } from "@/lib/categories";
import {
  recurringGroups,
  getRecurringGroupLabel,
  getRecurringItemLabel,
} from "@/lib/recurring";

function hashString(value: string) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash);
}

export function getCategoryUI(categoryName: string) {
  const normalized = categoryName?.toLowerCase().trim() || "default";
  const hue = hashString(normalized) % 360;
  return {
    backgroundColor: `hsl(${hue} 85% 80%)`,
    textColor: `hsl(${hue} 65% 30%)`,
  };
}

export function getCategoryIcon(categoryName: string) {
  const variableIcon = categoryConfig[categoryName as keyof typeof categoryConfig]?.icon;
  if (variableIcon) return variableIcon;
  const recurringGroup = recurringGroups.find(
    (group) =>
      group.value === categoryName ||
      group.label === categoryName ||
      group.items.includes(categoryName),
  );
  if (recurringGroup) return recurringGroup.icon;
  return categoryConfig.other.icon;
}

export function getCategoryLabel(categoryName: string, locale: "bg" | "en" = "bg") {
  const variable = categoryConfig[categoryName as keyof typeof categoryConfig];
  if (variable) {
    return locale === "en" ? variable.labelEn : variable.label;
  }
  const recurringGroup = recurringGroups.find(
    (group) =>
      group.value === categoryName ||
      group.label === categoryName ||
      group.labelEn === categoryName ||
      group.items.includes(categoryName) ||
      group.itemsEn.includes(categoryName),
  );
  if (recurringGroup) {
    if (
      recurringGroup.value === categoryName ||
      recurringGroup.label === categoryName ||
      recurringGroup.labelEn === categoryName
    ) {
      return getRecurringGroupLabel(recurringGroup, locale);
    }
    return getRecurringItemLabel(recurringGroup, categoryName, locale);
  }
  return categoryName;
}

export function getRecurringLabelForName(
  name: string | null | undefined,
  locale: "bg" | "en" = "bg",
) {
  if (!name) return name ?? "";
  const trimmed = name.trim();
  const recurringGroup = recurringGroups.find(
    (group) =>
      group.value === trimmed ||
      group.label === trimmed ||
      group.labelEn === trimmed ||
      group.items.includes(trimmed) ||
      group.itemsEn.includes(trimmed),
  );
  if (!recurringGroup) return name;
  if (
    recurringGroup.value === trimmed ||
    recurringGroup.label === trimmed ||
    recurringGroup.labelEn === trimmed
  ) {
    return getRecurringGroupLabel(recurringGroup, locale);
  }
  return getRecurringItemLabel(recurringGroup, trimmed, locale);
}
