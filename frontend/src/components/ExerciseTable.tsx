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
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="h-4.5 w-4.5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4 7a3 3 0 0 1 3-3h6"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M7 20a3 3 0 0 1-3-3V7"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M17 20H7"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M20 13v4a3 3 0 0 1-3 3"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M14.5 5.5 18.5 9.5"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12.5 17.5 18.8 11.2a2.12 2.12 0 1 0-3-3l-6.3 6.3L8.8 18l3.7-.5Z"
                      />
                    </svg>
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
