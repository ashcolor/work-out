import { Icon } from "@iconify/react";
import type { KeyboardEvent } from "react";
import type { Exercise, WorkoutLog } from "../types";
import { formatRelativeDate } from "../utils/formatRelativeDate";
import { groupExercisesByTag } from "../utils/groupExercisesByTag";

type Props = {
  exercises: Exercise[];
  onLog: (ex: Exercise) => void;
  onHistory: (ex: Exercise) => void;
};

function getLatestLog(exercise: Exercise): WorkoutLog | null {
  return exercise.recentLogs[0] ?? null;
}

function handleCardKeyDown(
  event: KeyboardEvent<HTMLElement>,
  exercise: Exercise,
  onHistory: (ex: Exercise) => void
) {
  if (event.key !== "Enter" && event.key !== " ") return;

  event.preventDefault();
  onHistory(exercise);
}

export function ExerciseTable({ exercises, onLog, onHistory }: Props) {
  const groups = groupExercisesByTag(exercises);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
      {groups.map((group) => (
        <section key={group.tag} className="w-full">
          <span>{group.tag}</span>

          <div className="flex w-full flex-col gap-2">
            {group.exercises.map((exercise) => {
              const latestLog = getLatestLog(exercise);

              return (
                <div key={exercise.id} className="join w-full shadow-sm">
                  <article
                    role="button"
                    tabIndex={0}
                    className="join-item group flex flex-1 cursor-pointer items-center gap-3 border border-base-300 bg-base-100 p-3 text-left transition hover:border-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/30"
                    onClick={() => onHistory(exercise)}
                    onKeyDown={(event) => handleCardKeyDown(event, exercise, onHistory)}
                  >
                    <h3 className="min-w-0 flex-1 truncate text-base font-semibold leading-snug text-base-content">
                      {exercise.name}
                    </h3>

                    <span className="shrink-0 text-xs text-base-content/55">
                      {latestLog ? formatRelativeDate(latestLog.date) : "記録なし"}
                    </span>
                  </article>

                  <button
                    type="button"
                    className="btn join-item h-auto min-h-0 self-stretch border border-base-300 bg-base-100 px-4 hover:border-primary/30"
                    aria-label={`${exercise.name}を記録`}
                    title="新規記録"
                    onClick={() => onLog(exercise)}
                  >
                    <Icon icon="lucide:square-pen" className="size-4.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
