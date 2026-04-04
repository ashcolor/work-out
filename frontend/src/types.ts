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

export const TAG_COLORS: Record<string, string> = {
  腹筋: "badge-warning",
  肩: "badge-info",
  胸筋: "badge-error",
  脇腹: "badge-warning",
  背筋: "badge-primary",
  内もも: "badge-accent",
  中殿筋: "badge-secondary",
  もも筋: "badge-success",
};

export const ALL_TAGS = Object.keys(TAG_COLORS);
