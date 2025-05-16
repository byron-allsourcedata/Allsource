type PercentageMap = Record<string, number | string>;

export const mapGender = (gender: PercentageMap) => [
  {
    imageSrc: "/male.svg",
    label: "Male",
    percentage: parseFloat((gender["male"] ?? 0).toString()),
    fillColor: "rgba(98, 178, 253, 1)",
    bgColor: "rgba(193, 228, 255, 1)",
  },
  {
    imageSrc: "/female.svg",
    label: "Female",
    percentage: parseFloat((gender["female"] ?? 0).toString()),
    fillColor: "rgba(249, 155, 171, 1)",
    bgColor: "rgba(255, 222, 227, 1)",
  },
  // {
  //   imageSrc: "/male-female.svg",
  //   label: "Other",
  //   percentage: parseFloat((gender["U"] ?? 0).toString()),
  //   fillColor: "rgb(15, 209, 134)",
  //   bgColor: "rgb(96, 212, 166)",
  // },
];

export const mapState = (state: PercentageMap) =>
  Object.entries(state).map(([key, val]) => ({
    label: key.toUpperCase() === "OTHER" ? "Other" : key.toUpperCase(),
    percentage: typeof val === "string" ? parseFloat(val) : val,
    fillColor: getHeatmapColor(val),
    state: key.toUpperCase() === "OTHER" ? "" : key.toUpperCase(),
  }));

export const mapGenericPercentage = (input: PercentageMap) =>
  Object.entries(input).map(([label, percent]) => ({
    label,
    percent: typeof percent === "string" ? parseFloat(percent) : percent,
  }));

export const mapPieChart = (input: PercentageMap) =>
  Object.entries(input).map(([label, value]) => ({
    label,
    value: parseFloat(value.toString().replace("%", "")),
    color: getColorForLabel(label),
  }));

export const extractSemiCirclePercent = (
  input: PercentageMap,
  label: string
): number => parseFloat(input[label]?.toString().replace("%", "") ?? "0");

export const getHeatmapColor = (percent: number | string): string => {
  const value = typeof percent === "string" ? parseFloat(percent) : percent;
  if (value >= 50) return "#1E5FE0";
  if (value >= 30) return "#438AF8";
  if (value >= 15) return "#73A6F9";
  if (value >= 10) return "#8FB7FA";
  if (value >= 5) return "#A4C3FB";
  if (value >= 3) return "#BED4FC";
  return "#D4E0FC";
};

export const getColorForLabel = (label: string): string => {
  switch (label.toLowerCase()) {
    case "homeowner":
      return "rgba(249, 233, 156, 1)";
    case "married":
      return "rgba(249, 233, 156, 1)";
    case "have children":
      return "rgba(249, 233, 156, 1)";
    case "will vote":
      return "rgba(249, 233, 156, 1)";
    case "renter":
      return "rgba(249, 155, 171, 1)";
    case "single":
      return "rgba(249, 155, 171, 1)";
    case "don’t have children":
      return "rgba(249, 155, 171, 1)";
    case "won’t vote":
      return "rgba(249, 155, 171, 1)";
    default:
      return "rgba(155, 223, 196, 1)";
  }
};
