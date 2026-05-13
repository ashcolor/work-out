export type BodyPart = {
  id: number;
  name: string;
  sortOrder: number;
};

export type Exercise = {
  id: number;
  name: string;
  tag: string;
  bodyPartId: number;
  weightStep: number;
  sortOrder: number;
  recentLogs: WorkoutLog[];
};

export type WorkoutLog = {
  id?: number;
  weight: number | null;
  reps: number | null;
  date: string;
};
