import { Fragment } from "react";
import type { Exercise } from "../types";
import { TagBadge } from "./TagBadge";
import { SectionLabel } from "./SectionLabel";
import { formatRelativeDate } from "../utils/formatRelativeDate";
import { formatWeight } from "../utils/formatWeight";
import { groupExercisesByTag } from "../utils/groupExercisesByTag";

type Props = {
  exercises: Exercise[];
  onLog: (ex: Exercise) => void;
  onHistory: (ex: Exercise) => void;
};

function formatLog(log: { weight: number | null; date: string }) {
  return {
    value: formatWeight(log.weight),
    date: formatRelativeDate(log.date),
  };
}

export function ExerciseTable({ exercises, onLog, onHistory }: Props) {
  const groups = groupExercisesByTag(exercises);

  return (
    <div className="card bg-base-100 shadow">
      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>種目</th>
              <th>直近の履歴</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {groups.map((group) => (
              <Fragment key={group.tag}>
                <tr className="bg-base-200/60">
                  <td colSpan={3} className="py-2">
                    <SectionLabel label={group.tag} />
                  </td>
                </tr>
                {group.exercises.map((ex) => (
                  <tr key={ex.id} className="hover:bg-base-200">
                    <td>
                      <button
                        className="link link-hover font-medium"
                        onClick={() => onHistory(ex)}
                      >
                        {ex.name}
                      </button>
                    </td>
                    <td className="text-sm text-base-content/70">
                      {ex.recentLogs.length > 0 ? (
                        <div className="flex flex-col gap-0.5">
                          {ex.recentLogs.map((log, i) => {
                            const formatted = formatLog(log);
                            return (
                              <span key={i}>
                                {formatted.value}{" "}
                                <span className="text-base-content/40">
                                  {formatted.date}
                                </span>
                              </span>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="text-base-content/40">記録なし</span>
                      )}
                    </td>
                    <td>
                      <button
                        className="btn btn-ghost btn-xs btn-square"
                        onClick={() => onLog(ex)}
                        aria-label={`${ex.name}を記録`}
                        title="記録"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className="h-4 w-4"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M16.862 3.487a2.1 2.1 0 1 1 2.97 2.97L8.5 17.79 4 19l1.21-4.5 11.652-11.013Z"
                          />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
