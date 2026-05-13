import type { BodyPart, Exercise, WorkoutLog } from "./types";
import {
  DEFAULT_WEIGHT_STEP,
  buildExerciseList,
  loadData,
  nextId,
  saveData,
  type StoredLog,
} from "./storage";

export async function fetchBodyParts(): Promise<BodyPart[]> {
  const data = loadData();
  return [...data.bodyParts].sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function fetchExercises(): Promise<Exercise[]> {
  return buildExerciseList(loadData());
}

export async function addExercise(
  name: string,
  bodyPartId: number,
  weightStep: number = DEFAULT_WEIGHT_STEP
) {
  const data = loadData();
  const bodyPart = data.bodyParts.find((bp) => bp.id === bodyPartId);
  if (!bodyPart) {
    throw new Error("Invalid body part");
  }

  const maxSortOrder = data.exercises
    .filter((exercise) => exercise.bodyPartId === bodyPartId)
    .reduce((max, exercise) => (exercise.sortOrder > max ? exercise.sortOrder : max), 0);

  const created = {
    id: nextId(data.exercises),
    name,
    bodyPartId,
    weightStep,
    sortOrder: maxSortOrder + 1,
  };
  data.exercises.push(created);
  saveData(data);

  return {
    id: created.id,
    name: created.name,
    bodyPartId: created.bodyPartId,
    tag: bodyPart.name,
    weightStep: created.weightStep,
    sortOrder: created.sortOrder,
  };
}

export async function updateExerciseWeightStep(id: number, weightStep: number) {
  const data = loadData();
  const target = data.exercises.find((exercise) => exercise.id === id);
  if (!target) {
    throw new Error("Exercise not found");
  }
  target.weightStep = weightStep;
  saveData(data);
}

export async function updateExerciseName(id: number, name: string) {
  const data = loadData();
  const target = data.exercises.find((exercise) => exercise.id === id);
  if (!target) {
    throw new Error("Exercise not found");
  }
  target.name = name;
  saveData(data);
}

export async function updateBodyPartName(id: number, name: string) {
  const data = loadData();
  const target = data.bodyParts.find((bp) => bp.id === id);
  if (!target) {
    throw new Error("Body part not found");
  }
  target.name = name;
  saveData(data);
}

export async function reorderBodyParts(orderedIds: number[]) {
  const data = loadData();
  const byId = new Map(data.bodyParts.map((bp) => [bp.id, bp]));
  orderedIds.forEach((id, index) => {
    const target = byId.get(id);
    if (target) target.sortOrder = index + 1;
  });
  saveData(data);
}

export async function reorderExercises(orderedIds: number[]) {
  const data = loadData();
  const byId = new Map(data.exercises.map((exercise) => [exercise.id, exercise]));
  orderedIds.forEach((id, index) => {
    const target = byId.get(id);
    if (target) target.sortOrder = index + 1;
  });
  saveData(data);
}

export async function addBodyPart(name: string): Promise<BodyPart> {
  const data = loadData();
  const maxSortOrder = data.bodyParts.reduce(
    (max, bp) => (bp.sortOrder > max ? bp.sortOrder : max),
    0
  );
  const created: BodyPart = {
    id: nextId(data.bodyParts),
    name,
    sortOrder: maxSortOrder + 1,
  };
  data.bodyParts.push(created);
  saveData(data);
  return created;
}

export async function deleteExercise(id: number) {
  const data = loadData();
  data.exercises = data.exercises.filter((exercise) => exercise.id !== id);
  data.logs = data.logs.filter((log) => log.exerciseId !== id);
  saveData(data);
}

export async function addLog(
  exerciseId: number,
  weight: number | null,
  reps: number | null,
  date: string
) {
  const data = loadData();
  const created: StoredLog = {
    id: nextId(data.logs),
    exerciseId,
    weight,
    reps,
    date,
  };
  data.logs.push(created);
  saveData(data);
  return { id: created.id };
}

export async function fetchLogs(exerciseId: number): Promise<Array<WorkoutLog & { id: number }>> {
  const data = loadData();
  return data.logs
    .filter((log) => log.exerciseId === exerciseId)
    .sort((a, b) => {
      const dateDiff = b.date.localeCompare(a.date);
      if (dateDiff !== 0) return dateDiff;
      return b.id - a.id;
    })
    .map(({ id, weight, reps, date }) => ({ id, weight, reps, date }));
}

export async function updateLog(
  id: number,
  weight: number | null,
  reps: number | null,
  date: string
) {
  const data = loadData();
  const target = data.logs.find((log) => log.id === id);
  if (!target) {
    throw new Error("Log not found");
  }
  target.weight = weight;
  target.reps = reps;
  target.date = date;
  saveData(data);
  return { ok: true };
}

export async function deleteLog(id: number) {
  const data = loadData();
  data.logs = data.logs.filter((log) => log.id !== id);
  saveData(data);
}
