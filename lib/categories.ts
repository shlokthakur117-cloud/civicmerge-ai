export const civicCategories = [
  { value: "pothole", label: "Pothole" },
  { value: "streetlight", label: "Streetlight" },
  { value: "garbage", label: "Garbage" },
  { value: "water_leak", label: "Water Leak" },
  { value: "drainage", label: "Drainage" },
  { value: "other", label: "Other" },
] as const;

export type CivicCategory = (typeof civicCategories)[number]["value"];

export function isCivicCategory(value: string): value is CivicCategory {
  return civicCategories.some((category) => category.value === value);
}

export function civicCategoryLabel(value: string) {
  return civicCategories.find((category) => category.value === value)?.label ?? "Other";
}
