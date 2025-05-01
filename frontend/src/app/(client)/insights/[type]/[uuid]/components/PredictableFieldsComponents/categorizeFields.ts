import { featureCategoryMap, CategorizedFields } from "./featureCategories";

export function categorizeFields(
  fields: Record<string, number>
): CategorizedFields {
  const categorized: CategorizedFields = {
    personal: {},
    financial: {},
    lifestyle: {},
    voter: {},
    employment: {},
    professional: {},
  };

  function camelToSnake(key: string): string {
    return key
      .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
      .replace(/([A-Z])([A-Z][a-z])/g, "$1_$2")
      .toLowerCase();
  }

  for (const [key, value] of Object.entries(fields)) {
    const snakeKey = camelToSnake(key);
    const category = featureCategoryMap[snakeKey];
    if (category) {
      categorized[category][key] = value;
    }
  }

  return categorized;
}
