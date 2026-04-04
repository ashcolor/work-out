import { TAG_COLORS } from "../types";

export function TagBadge({ tag }: { tag: string }) {
  const color = TAG_COLORS[tag] ?? "badge-ghost";
  return <span className={`badge ${color} badge-sm`}>{tag}</span>;
}
