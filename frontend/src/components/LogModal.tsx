import { useState } from "react";
import { addLog } from "../api";
import type { Exercise } from "../types";

type Props = {
  exercise: Exercise;
  onClose: () => void;
  onAdded: () => void;
};

export function LogModal({ exercise, onClose, onAdded }: Props) {
  const today = new Date().toISOString().slice(0, 10);
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [date, setDate] = useState(today);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addLog(
      exercise.id,
      weight ? parseFloat(weight) : null,
      reps ? parseInt(reps) : null,
      date
    );
    onAdded();
    onClose();
  };

  return (
    <dialog className="modal modal-open">
      <div className="modal-box">
        <h3 className="font-bold text-lg mb-4">{exercise.name} を記録</h3>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <label className="form-control">
            <div className="label">
              <span className="label-text">重量 (kg)</span>
            </div>
            <input
              type="number"
              step="0.1"
              placeholder="例: 50"
              className="input input-bordered"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              autoFocus
            />
          </label>
          <label className="form-control">
            <div className="label">
              <span className="label-text">回数</span>
            </div>
            <input
              type="number"
              placeholder="例: 10"
              className="input input-bordered"
              value={reps}
              onChange={(e) => setReps(e.target.value)}
            />
          </label>
          <label className="form-control">
            <div className="label">
              <span className="label-text">日付</span>
            </div>
            <input
              type="date"
              className="input input-bordered"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>
          <div className="modal-action">
            <button type="button" className="btn" onClick={onClose}>
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
