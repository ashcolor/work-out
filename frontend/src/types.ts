export type Exercise = {
  id: number;
  name: string;
  tag: string;
  recentLogs: WorkoutLog[];
};

export type WorkoutLog = {
  id?: number;
  weight: number | null;
  reps: number | null;
  date: string;
};

export const ALL_TAGS = [
  "肩",
  "胸筋",
  "背筋",
  "腹筋",
  "脇腹",
  "中殿筋",
  "もも筋",
  "内もも",
];
