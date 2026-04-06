import { useState } from "react";
import { addLog } from "../api";
import type { Exercise } from "../types";
import { formatRelativeDate } from "../utils/formatRelativeDate";
import { formatWeight } from "../utils/formatWeight";

type Props = {
  exercise: Exercise;
  onClose: () => void;
  onAdded: () => void;
};

const WEIGHT_STEP_OPTIONS = [2.5, 5, 7.5, 10];

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

function StepIcon({ type }: { type: "plus" | "minus" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={`h-4 w-4 shrink-0 ${type === "plus" ? "" : "h-3.5 w-3.5"}`}
    >
      <circle cx="12" cy="12" r="9" />
      {type === "plus" ? (
        <path strokeLinecap="round" d="M12 8v8M8 12h8" />
      ) : (
        <path strokeLinecap="round" d="M8 12h8" />
      )}
    </svg>
  );
}

function getInitialWeight(exercise: Exercise) {
  const latestWeight = exercise.recentLogs.find((log) => log.weight != null)?.weight;
  return latestWeight != null ? formatWeightValue(latestWeight) : "";
}

export function LogModal({ exercise, onClose, onAdded }: Props) {
  const [date, setDate] = useState(getLocalToday());
  const [weight, setWeight] = useState(getInitialWeight(exercise));
  const recentLogs = exercise.recentLogs.slice(0, 3);

  const handleAdjustWeight = (delta: number) => {
    const base = weight === "" ? 0 : Number(weight);
    if (Number.isNaN(base)) return;

    const next = Math.max(0, Math.round((base + delta) * 100) / 100);
    setWeight(formatWeightValue(next));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    await addLog(
      exercise.id,
      weight === "" ? null : Number(weight),
      null,
      date
    );

    onAdded();
    onClose();
  };

  const hasPreviousWeight = getInitialWeight(exercise) !== "";

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

          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-4 gap-2">
              {WEIGHT_STEP_OPTIONS.map((delta) => (
                <button
                  key={`plus-${delta}`}
                  type="button"
                  className="btn btn-sm btn-primary btn-soft min-w-0 flex-1 whitespace-nowrap"
                  onClick={() => handleAdjustWeight(delta)}
                >
                  <StepIcon type="plus" />
                  <span className="text-base font-semibold">{delta}</span>
                </button>
              ))}
            </div>
            <div className="grid grid-cols-4 gap-2">
              {WEIGHT_STEP_OPTIONS.map((delta) => (
                <button
                  key={`minus-${delta}`}
                  type="button"
                  className="btn btn-sm btn-error btn-soft min-w-0 flex-1 whitespace-nowrap"
                  onClick={() => handleAdjustWeight(-delta)}
                >
                  <StepIcon type="minus" />
                  <span className="text-base font-semibold">{delta}</span>
                </button>
              ))}
            </div>
          </div>

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
