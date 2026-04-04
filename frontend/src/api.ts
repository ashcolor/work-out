import type { Exercise } from "./types";

const BASE = "/api";

export async function fetchExercises(): Promise<Exercise[]> {
  const res = await fetch(`${BASE}/exercises`);
  return res.json();
}

export async function addExercise(name: string, tag: string) {
  const res = await fetch(`${BASE}/exercises`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, tag }),
  });
  return res.json();
}

export async function deleteExercise(id: number) {
  await fetch(`${BASE}/exercises/${id}`, { method: "DELETE" });
}

export async function addLog(
  exerciseId: number,
  weight: number | null,
  reps: number | null,
  date: string
) {
  const res = await fetch(`${BASE}/logs/${exerciseId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ weight, reps, date }),
  });
  return res.json();
}

export async function fetchLogs(exerciseId: number) {
  const res = await fetch(`${BASE}/logs/${exerciseId}`);
  return res.json();
}

export async function deleteLog(id: number) {
  await fetch(`${BASE}/logs/entry/${id}`, { method: "DELETE" });
}
