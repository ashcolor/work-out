import type { BodyPart, Exercise, WorkoutLog } from "./types";

const STORAGE_KEY = "workout-app:data";
const DATA_VERSION = 4;

export const DEFAULT_WEIGHT_STEP = 2.5;

export type StoredLog = {
  id: number;
  exerciseId: number;
  weight: number | null;
  reps: number | null;
  date: string;
};

export type StoredExercise = {
  id: number;
  name: string;
  bodyPartId: number;
  weightStep: number;
  sortOrder: number;
};

export type AppData = {
  version: number;
  bodyParts: BodyPart[];
  exercises: StoredExercise[];
  logs: StoredLog[];
};

const DEFAULT_BODY_PARTS: BodyPart[] = [
  { id: 1, name: "肩", sortOrder: 1 },
  { id: 2, name: "胸", sortOrder: 2 },
  { id: 3, name: "腕", sortOrder: 3 },
  { id: 4, name: "背筋", sortOrder: 4 },
  { id: 5, name: "腹", sortOrder: 5 },
  { id: 6, name: "脚", sortOrder: 6 },
];

const DEFAULT_EXERCISES: StoredExercise[] = [
  { id: 1, name: "ショルダープレス", bodyPartId: 1, weightStep: 2.25, sortOrder: 1 },
  { id: 2, name: "ベンチプレス", bodyPartId: 2, weightStep: 2.5, sortOrder: 1 },
  { id: 3, name: "チェストプレス", bodyPartId: 2, weightStep: 2.25, sortOrder: 2 },
  { id: 4, name: "ラットプル", bodyPartId: 4, weightStep: 2.25, sortOrder: 1 },
  { id: 5, name: "リアフライ", bodyPartId: 4, weightStep: 2.25, sortOrder: 2 },
  { id: 6, name: "バックエクステンション", bodyPartId: 4, weightStep: 3.75, sortOrder: 3 },
  { id: 7, name: "ローイング", bodyPartId: 4, weightStep: 2.5, sortOrder: 4 },
  { id: 8, name: "トルソローテーション", bodyPartId: 5, weightStep: 2.25, sortOrder: 1 },
  { id: 9, name: "アブドミナル", bodyPartId: 5, weightStep: 3.75, sortOrder: 2 },
  { id: 10, name: "レッグエクステンション", bodyPartId: 6, weightStep: 2.25, sortOrder: 1 },
  { id: 11, name: "レッグプレス", bodyPartId: 6, weightStep: 4.5, sortOrder: 2 },
  { id: 12, name: "レッグカール", bodyPartId: 6, weightStep: 2.25, sortOrder: 3 },
  { id: 13, name: "ヒップアダクター", bodyPartId: 6, weightStep: 3.75, sortOrder: 4 },
  { id: 14, name: "ヒップアブダクター", bodyPartId: 6, weightStep: 3.75, sortOrder: 5 },
];

function normalizeWeightStep(value: unknown): number {
  const num = Number(value);
  if (Number.isFinite(num) && num > 0) return num;
  return DEFAULT_WEIGHT_STEP;
}

function normalizeExercise(value: unknown): StoredExercise | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Partial<StoredExercise>;
  if (typeof v.id !== "number" || typeof v.name !== "string" || typeof v.bodyPartId !== "number") {
    return null;
  }
  return {
    id: v.id,
    name: v.name,
    bodyPartId: v.bodyPartId,
    weightStep: normalizeWeightStep(v.weightStep),
    sortOrder: typeof v.sortOrder === "number" ? v.sortOrder : 0,
  };
}

function assignInitialExerciseSortOrder(exercises: StoredExercise[]) {
  const byBodyPart = new Map<number, StoredExercise[]>();
  for (const exercise of exercises) {
    const list = byBodyPart.get(exercise.bodyPartId);
    if (list) list.push(exercise);
    else byBodyPart.set(exercise.bodyPartId, [exercise]);
  }
  for (const list of byBodyPart.values()) {
    list
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name, "ja"))
      .forEach((exercise, index) => {
        exercise.sortOrder = index + 1;
      });
  }
}

function createInitialData(): AppData {
  return {
    version: DATA_VERSION,
    bodyParts: DEFAULT_BODY_PARTS,
    exercises: DEFAULT_EXERCISES,
    logs: [],
  };
}

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = createInitialData();
      saveData(initial);
      return initial;
    }

    const parsed = JSON.parse(raw) as Partial<AppData>;
    const prevVersion = typeof parsed.version === "number" ? parsed.version : 1;
    const exercises = (parsed.exercises ?? [])
      .map(normalizeExercise)
      .filter((exercise): exercise is StoredExercise => exercise !== null);

    if (prevVersion < 3) {
      const defaultStepByName = new Map(DEFAULT_EXERCISES.map((e) => [e.name, e.weightStep]));
      for (const exercise of exercises) {
        const defaultStep = defaultStepByName.get(exercise.name);
        if (defaultStep != null) {
          exercise.weightStep = defaultStep;
        }
      }
    }

    if (prevVersion < 4) {
      assignInitialExerciseSortOrder(exercises);
    }

    const data: AppData = {
      version: DATA_VERSION,
      bodyParts: parsed.bodyParts ?? [],
      exercises,
      logs: parsed.logs ?? [],
    };

    if (prevVersion < DATA_VERSION) {
      saveData(data);
    }

    return data;
  } catch {
    const initial = createInitialData();
    saveData(initial);
    return initial;
  }
}

export function saveData(data: AppData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function replaceData(data: AppData) {
  const exercises = (data.exercises ?? [])
    .map(normalizeExercise)
    .filter((exercise): exercise is StoredExercise => exercise !== null);
  saveData({
    version: DATA_VERSION,
    bodyParts: data.bodyParts ?? [],
    exercises,
    logs: data.logs ?? [],
  });
}

export function nextId<T extends { id: number }>(items: T[]): number {
  return items.reduce((max, item) => (item.id > max ? item.id : max), 0) + 1;
}

export function buildExerciseList(data: AppData): Exercise[] {
  const bodyPartById = new Map(data.bodyParts.map((bp) => [bp.id, bp]));
  const sortOrderByBodyPartId = new Map(data.bodyParts.map((bp) => [bp.id, bp.sortOrder]));

  const logsByExerciseId = new Map<number, StoredLog[]>();
  for (const log of data.logs) {
    const list = logsByExerciseId.get(log.exerciseId);
    if (list) {
      list.push(log);
    } else {
      logsByExerciseId.set(log.exerciseId, [log]);
    }
  }

  return [...data.exercises]
    .sort((a, b) => {
      const orderA = sortOrderByBodyPartId.get(a.bodyPartId) ?? Number.MAX_SAFE_INTEGER;
      const orderB = sortOrderByBodyPartId.get(b.bodyPartId) ?? Number.MAX_SAFE_INTEGER;
      if (orderA !== orderB) return orderA - orderB;
      if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
      return a.name.localeCompare(b.name, "ja");
    })
    .map((exercise) => {
      const bodyPart = bodyPartById.get(exercise.bodyPartId);
      const logs = (logsByExerciseId.get(exercise.id) ?? [])
        .slice()
        .sort((a, b) => {
          const dateDiff = b.date.localeCompare(a.date);
          if (dateDiff !== 0) return dateDiff;
          return b.id - a.id;
        })
        .slice(0, 3)
        .map<WorkoutLog>((log) => ({
          id: log.id,
          weight: log.weight,
          reps: log.reps,
          date: log.date,
        }));

      return {
        id: exercise.id,
        name: exercise.name,
        tag: bodyPart?.name ?? "",
        bodyPartId: exercise.bodyPartId,
        weightStep: exercise.weightStep,
        sortOrder: exercise.sortOrder,
        recentLogs: logs,
      };
    });
}
