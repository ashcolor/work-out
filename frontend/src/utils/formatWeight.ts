export function formatWeight(weight: number | null) {
  if (weight == null) return "-";
  return `${weight.toFixed(1)}kg`;
}
