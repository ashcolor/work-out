import { useEffect, useState, type FormEvent } from "react";
import { addExercise } from "../api";
import { DEFAULT_WEIGHT_STEP } from "../storage";
import type { BodyPart, Exercise } from "../types";

type Props = {
  bodyParts: BodyPart[];
  onClose: () => void;
  onAdded: (exercise: Exercise) => void;
};

function formatStepValue(value: number) {
  return value.toFixed(2).replace(/\.?0+$/, "");
}

function parseStep(value: string): number | null {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return null;
  return num;
}

export function AddExerciseModal({ bodyParts, onClose, onAdded }: Props) {
  const [name, setName] = useState("");
  const [bodyPartId, setBodyPartId] = useState<number>(bodyParts[0]?.id ?? 0);
  const [step, setStep] = useState(formatStepValue(DEFAULT_WEIGHT_STEP));
  const hasBodyParts = bodyParts.length > 0;

  useEffect(() => {
    if (!hasBodyParts) {
      setBodyPartId(0);
      return;
    }

    const selectedExists = bodyParts.some((bodyPart) => bodyPart.id === bodyPartId);
    if (!selectedExists) {
      setBodyPartId(bodyParts[0].id);
    }
  }, [bodyPartId, bodyParts, hasBodyParts]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !bodyPartId) return;

    const parsedStep = parseStep(step);
    if (parsedStep == null) return;

    const created = await addExercise(name.trim(), bodyPartId, parsedStep);
    onAdded({ ...created, recentLogs: [] });
  };

  return (
    <dialog className="modal modal-open">
      <div className="modal-box max-w-md">
        <h3 className="mb-4 text-lg font-bold">種目を追加</h3>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="text"
            placeholder="種目名"
            className="input input-bordered w-full"
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoFocus
          />
          <select
            className="select select-bordered w-full"
            value={bodyPartId}
            onChange={(event) => setBodyPartId(Number(event.target.value))}
            disabled={!hasBodyParts}
          >
            {bodyParts.map((bodyPart) => (
              <option key={bodyPart.id} value={bodyPart.id}>
                {bodyPart.name}
              </option>
            ))}
          </select>
          {!hasBodyParts && <div className="text-sm text-error">部位マスタが未登録です</div>}
          <label className="form-control">
            <div className="label">
              <span className="label-text">重量増減ステップ</span>
            </div>
            <div className="relative">
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                className="input input-bordered w-full pr-10 text-right"
                value={step}
                onChange={(event) => setStep(event.target.value)}
              />
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-base-content/60">
                kg
              </span>
            </div>
          </label>
          <div className="modal-action">
            <button type="button" className="btn" onClick={onClose}>
              閉じる
            </button>
            <button type="submit" className="btn btn-primary" disabled={!hasBodyParts}>
              追加
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
