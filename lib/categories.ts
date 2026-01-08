import {
  BadgePercent,
  Car,
  Cigarette,
  CircleEllipsis,
  Gift,
  HeartPulse,
  Home,
  Martini,
  Music,
  Shirt,
  ShoppingBag,
  Sparkles,
  UtensilsCrossed,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const categoryKeys = [
  "food_supermarket",
  "restaurants_cafe",
  "transport",
  "home_bills",
  "clothing",
  "subscriptions",
  "entertainment",
  "health",
  "alcohol",
  "tobacco",
  "beauty",
  "gifts",
  "other",
] as const;

export type CategoryKey = (typeof categoryKeys)[number];

export const categoryConfig: Record<
  CategoryKey,
  { label: string; labelEn: string; icon: LucideIcon; color: string }
> = {
  food_supermarket: {
    label: "Храна & супермаркет",
    labelEn: "Food & supermarket",
    icon: ShoppingBag,
    color: "from-emerald-400/70 to-emerald-600/60",
  },
  restaurants_cafe: {
    label: "Ресторанти & кафе",
    labelEn: "Restaurants & cafe",
    icon: UtensilsCrossed,
    color: "from-amber-400/70 to-orange-500/60",
  },
  transport: {
    label: "Транспорт",
    labelEn: "Transport",
    icon: Car,
    color: "from-sky-400/70 to-blue-600/60",
  },
  home_bills: {
    label: "Дом & сметки",
    labelEn: "Home & bills",
    icon: Home,
    color: "from-purple-400/70 to-indigo-600/60",
  },
  clothing: {
    label: "Дрехи",
    labelEn: "Clothing",
    icon: Shirt,
    color: "from-pink-400/70 to-rose-500/60",
  },
  subscriptions: {
    label: "Абонаменти",
    labelEn: "Subscriptions",
    icon: BadgePercent,
    color: "from-cyan-400/70 to-teal-500/60",
  },
  entertainment: {
    label: "Забавления",
    labelEn: "Entertainment",
    icon: Music,
    color: "from-lime-400/70 to-green-500/60",
  },
  health: {
    label: "Здраве",
    labelEn: "Health",
    icon: HeartPulse,
    color: "from-red-400/70 to-rose-600/60",
  },
  alcohol: {
    label: "Алкохол",
    labelEn: "Alcohol",
    icon: Martini,
    color: "from-amber-500/70 to-yellow-600/60",
  },
  tobacco: {
    label: "Цигари/тютюн",
    labelEn: "Tobacco",
    icon: Cigarette,
    color: "from-slate-400/70 to-slate-600/60",
  },
  beauty: {
    label: "Козметика",
    labelEn: "Beauty",
    icon: Sparkles,
    color: "from-fuchsia-400/70 to-purple-500/60",
  },
  gifts: {
    label: "Подаръци",
    labelEn: "Gifts",
    icon: Gift,
    color: "from-orange-400/70 to-amber-500/60",
  },
  other: {
    label: "Друго",
    labelEn: "Other",
    icon: CircleEllipsis,
    color: "from-slate-400/70 to-slate-600/60",
  },
};

export const categoryOptions = categoryKeys.map((value) => ({
  value,
  label: categoryConfig[value].label,
}));

export const getCategoryLabelForLocale = (key: CategoryKey, locale: "bg" | "en") =>
  locale === "en" ? categoryConfig[key].labelEn : categoryConfig[key].label;

export const getCategoryOptionsForLocale = (locale: "bg" | "en") =>
  categoryKeys.map((value) => ({
    value,
    label: getCategoryLabelForLocale(value, locale),
  }));
