import { useState } from "react";
import { addLog } from "../api";
import type { Exercise, WorkoutLog } from "../types";
import { formatRelativeDate } from "../utils/formatRelativeDate";
import { formatWeight } from "../utils/formatWeight";

type Props = {
  exercise: Exercise;
  onClose: () => void;
  onAdded: (log: WorkoutLog & { id: number }) => void;
};

function getLocalToday() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatWeightValue(value: number) {
  return value.toFixed(2).replace(/\.?0+$/, "");
}

function getInitialWeight(exercise: Exercise) {
  const latestWeight = exercise.recentLogs.find((log) => log.weight != null)?.weight;
  return latestWeight != null ? formatWeightValue(latestWeight) : "";
}

export function LogModal({ exercise, onClose, onAdded }: Props) {
  const [date, setDate] = useState(getLocalToday());
  const [weight, setWeight] = useState(getInitialWeight(exercise));
  const recentLogs = exercise.recentLogs.slice(0, 3);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const weightValue = weight === "" ? null : Number(weight);
    const created = await addLog(exercise.id, weightValue, null, date);

    onAdded({
      id: created.id,
      weight: weightValue,
      reps: null,
      date,
    });
    onClose();
  };

  return (
    <dialog className="modal modal-open">
      <div className="modal-box">
        <h3 className="mb-4 text-lg font-bold">{exercise.name} を記録</h3>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="form-control">
            <div className="label">
              <span className="label-text">日付</span>
            </div>
            <input
              type="date"
              className="input input-bordered"
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          </label>

          <div className="rounded-2xl bg-base-200/70 p-4">
            <div className="mb-2 text-sm font-semibold">過去3回の記録</div>
            {recentLogs.length > 0 ? (
              <div className="flex flex-col gap-2">
                {recentLogs.map((log, index) => (
                  <div
                    key={`${log.date}-${index}`}
                    className="flex items-center justify-between rounded-xl bg-base-100 px-3 py-2"
                  >
                    <span className="text-sm text-base-content/60">
                      {formatRelativeDate(log.date)}
                    </span>
                    <span className="text-base font-semibold">
                      {formatWeight(log.weight)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-base-content/50">まだ記録がありません</div>
            )}
          </div>

          <label className="form-control">
            <div className="label">
              <span className="label-text">重量</span>
            </div>
            <div className="relative">
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                className="input input-bordered w-full px-4 py-3 pr-14 text-right text-3xl font-bold tracking-tight"
                value={weight}
                onChange={(event) => setWeight(event.target.value)}
              />
              <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm font-medium text-base-content/60">
                kg
              </span>
            </div>
          </label>

          <div className="modal-action">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              キャンセル
            </button>
            <button type="submit" className="btn btn-primary">
              記録
            </button>
          </div>
        </form>
      </div>

      <form method="dialog" className="modal-backdrop">
        <button onClick={onClose}>close</button>
      </form>
    </dialog>
  );
}
