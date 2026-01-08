import type { CategoryKey } from "@/lib/categories";

const map: Record<string, CategoryKey> = {
  Fuel: "transport",
  "Groceries & Food": "food_supermarket",
  "Restaurants & Cafes": "restaurants_cafe",
  Transport: "transport",
  "Home & Utilities": "home_bills",
  Clothing: "clothing",
  Subscriptions: "subscriptions",
  Entertainment: "entertainment",
  Health: "health",
  Alcohol: "alcohol",
  "Cigarettes & Tobacco": "tobacco",
  Cosmetics: "beauty",
  Gifts: "gifts",
  Other: "other",
};

export function mapAssistantCategory(category: string | null) {
  if (!category) return "other";
  return map[category] ?? "other";
}

const reverseMap: Record<CategoryKey, string> = {
  food_supermarket: "Groceries & Food",
  restaurants_cafe: "Restaurants & Cafes",
  transport: "Transport",
  home_bills: "Home & Utilities",
  clothing: "Clothing",
  subscriptions: "Subscriptions",
  entertainment: "Entertainment",
  health: "Health",
  alcohol: "Alcohol",
  tobacco: "Cigarettes & Tobacco",
  beauty: "Cosmetics",
  gifts: "Gifts",
  other: "Other",
};

export function mapCategoryKeyToAssistant(category: CategoryKey | string) {
  return reverseMap[category as CategoryKey] ?? "Other";
}
