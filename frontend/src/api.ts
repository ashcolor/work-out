import type { BodyPart, Exercise, WorkoutLog } from "./types";
import { buildExerciseList, loadData, nextId, saveData, type StoredLog } from "./storage";

export async function fetchBodyParts(): Promise<BodyPart[]> {
  const data = loadData();
  return [...data.bodyParts].sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function fetchExercises(): Promise<Exercise[]> {
  return buildExerciseList(loadData());
}

export async function addExercise(name: string, bodyPartId: number) {
  const data = loadData();
  const bodyPart = data.bodyParts.find((bp) => bp.id === bodyPartId);
  if (!bodyPart) {
    throw new Error("Invalid body part");
  }

  const created = {
    id: nextId(data.exercises),
    name,
    bodyPartId,
  };
  data.exercises.push(created);
  saveData(data);

  return {
    id: created.id,
    name: created.name,
    bodyPartId: created.bodyPartId,
    tag: bodyPart.name,
  };
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
