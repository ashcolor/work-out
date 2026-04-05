import type { BodyPart, Exercise } from "./types";

const BASE = "/api";

export async function login(username: string, password: string): Promise<boolean> {
  const res = await fetch(`${BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  return res.ok;
}

export async function logout(): Promise<void> {
  await fetch(`${BASE}/logout`, { method: "POST" });
}

export async function checkAuth(): Promise<boolean> {
  const res = await fetch(`${BASE}/me`);
  return res.ok;
}

export async function fetchBodyParts(): Promise<BodyPart[]> {
  const res = await fetch(`${BASE}/body-parts`);
  return res.json();
}

export async function fetchExercises(): Promise<Exercise[]> {
  const res = await fetch(`${BASE}/exercises`);
  return res.json();
}

export async function addExercise(name: string, bodyPartId: number) {
  const res = await fetch(`${BASE}/exercises`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, bodyPartId }),
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
