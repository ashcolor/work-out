import type { Exercise } from "../types";

export function groupExercisesByTag(exercises: Exercise[]) {
  const groups = new Map<string, Exercise[]>();

  for (const exercise of exercises) {
    const items = groups.get(exercise.tag) ?? [];
    items.push(exercise);
    groups.set(exercise.tag, items);
  }

  return Array.from(groups.entries()).map(([tag, items]) => ({
    tag,
    exercises: items,
  }));
}
