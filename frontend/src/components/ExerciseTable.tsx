import { Icon } from "@iconify/react";
import type { KeyboardEvent } from "react";
import type { Exercise, WorkoutLog } from "../types";
import { SectionLabel } from "./SectionLabel";
import { formatRelativeDate } from "../utils/formatRelativeDate";
import { formatWeight } from "../utils/formatWeight";
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
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      {groups.map((group) => (
        <section key={group.tag} className="w-full space-y-3">
          <SectionLabel label={group.tag} />

          <div className="flex w-full max-w-5xl flex-row flex-wrap gap-3">
            {group.exercises.map((exercise) => {
              const latestLog = getLatestLog(exercise);

              return (
                <article
                  key={exercise.id}
                  role="button"
                  tabIndex={0}
                  className="group relative flex min-h-[76px] min-w-[150px] basis-[170px] cursor-pointer flex-col justify-between rounded-2xl border border-base-300 bg-base-100 p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/30"
                  onClick={() => onHistory(exercise)}
                  onKeyDown={(event) => handleCardKeyDown(event, exercise, onHistory)}
                >
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm btn-circle absolute right-2 top-2 h-8 min-h-8 w-8 opacity-70 transition group-hover:opacity-100"
                    aria-label={`${exercise.name}を記録`}
                    title="新規記録"
                    onClick={(event) => {
                      event.stopPropagation();
                      onLog(exercise);
                    }}
                  >
                    <Icon icon="lucide:square-pen" className="size-[18px]" />
                  </button>

                  <div className="w-full pr-10">
                    <h2 className="text-base font-semibold leading-snug text-base-content">
                      {exercise.name}
                    </h2>
                  </div>

                  {latestLog ? (
                    <div className="flex w-full items-center gap-2 text-xs text-base-content/55">
                      <span>{formatRelativeDate(latestLog.date)}</span>
                      <span className="text-[11px] text-base-content/45">
                        {formatWeight(latestLog.weight)}
                      </span>
                    </div>
                  ) : (
                    <div className="w-full text-xs text-base-content/45">記録なし</div>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
