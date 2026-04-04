import { useEffect, useState } from "react";
import { fetchLogs, deleteLog } from "../api";
import type { Exercise, WorkoutLog } from "../types";
import { TagBadge } from "./TagBadge";

type Props = {
  exercise: Exercise;
  onClose: () => void;
};

type LogEntry = WorkoutLog & { id: number };

export function HistoryModal({ exercise, onClose }: Props) {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const load = async () => {
    const data = await fetchLogs(exercise.id);
    setLogs(data);
  };

  useEffect(() => {
    load();
  }, [exercise.id]);

  const handleDelete = async (id: number) => {
    if (!confirm("この記録を削除する？")) return;
    await deleteLog(id);
    load();
  };

  return (
    <dialog className="modal modal-open">
      <div className="modal-box max-w-lg">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="font-bold text-lg">{exercise.name}</h3>
          <TagBadge tag={exercise.tag} />
        </div>

        {logs.length === 0 ? (
          <p className="text-base-content/50">記録がありません</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>日付</th>
                  <th>重量</th>
                  <th>回数</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td>{log.date}</td>
                    <td>{log.weight != null ? `${log.weight} kg` : "-"}</td>
                    <td>{log.reps != null ? `${log.reps} 回` : "-"}</td>
                    <td>
                      <button
                        className="btn btn-ghost btn-xs text-error"
                        onClick={() => handleDelete(log.id)}
                      >
                        削除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="modal-action">
          <button className="btn" onClick={onClose}>
            閉じる
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={onClose}>close</button>
      </form>
    </dialog>
  );
}
