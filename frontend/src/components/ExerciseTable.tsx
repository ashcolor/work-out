import type { Exercise } from "../types";
import { TagBadge } from "./TagBadge";
import { deleteExercise } from "../api";

type Props = {
  exercises: Exercise[];
  onLog: (ex: Exercise) => void;
  onHistory: (ex: Exercise) => void;
  onDelete: () => void;
};

function formatLog(log: { weight: number | null; date: string }) {
  const d = log.date.slice(5); // "MM/DD" or "M/D"
  const [m, d2] = d.split("-");
  const display = `${parseInt(m)}/${parseInt(d2)}`;
  if (log.weight == null) return `kg (${display})`;
  return `${log.weight} kg (${display})`;
}

export function ExerciseTable({ exercises, onLog, onHistory, onDelete }: Props) {
  const handleDelete = async (ex: Exercise) => {
    if (!confirm(`「${ex.name}」を削除する？`)) return;
    await deleteExercise(ex.id);
    onDelete();
  };

  return (
    <div className="card bg-base-100 shadow">
      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>名前</th>
              <th>直近の履歴</th>
              <th>タグ</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {exercises.map((ex) => (
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
                      {ex.recentLogs.map((log, i) => (
                        <span key={i}>{formatLog(log)}</span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-base-content/40">記録なし</span>
                  )}
                </td>
                <td>
                  <TagBadge tag={ex.tag} />
                </td>
                <td>
                  <div className="flex gap-1">
                    <button
                      className="btn btn-ghost btn-xs"
                      onClick={() => onLog(ex)}
                    >
                      記録
                    </button>
                    <button
                      className="btn btn-ghost btn-xs text-error"
                      onClick={() => handleDelete(ex)}
                    >
                      削除
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
