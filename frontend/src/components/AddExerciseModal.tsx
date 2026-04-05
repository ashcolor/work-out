import { useEffect, useState } from "react";
import { addExercise } from "../api";
import type { BodyPart } from "../types";

type Props = {
  bodyParts: BodyPart[];
  onClose: () => void;
  onChanged: () => Promise<void>;
};

export function AddExerciseModal({ bodyParts, onClose, onChanged }: Props) {
  const [name, setName] = useState("");
  const [bodyPartId, setBodyPartId] = useState<number>(bodyParts[0]?.id ?? 0);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !bodyPartId) return;

    await addExercise(name.trim(), bodyPartId);
    setName("");
    await onChanged();
    onClose();
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
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
          <select
            className="select select-bordered w-full"
            value={bodyPartId}
            onChange={(e) => setBodyPartId(Number(e.target.value))}
            disabled={!hasBodyParts}
          >
            {bodyParts.map((bodyPart) => (
              <option key={bodyPart.id} value={bodyPart.id}>
                {bodyPart.name}
              </option>
            ))}
          </select>
          {!hasBodyParts && (
            <div className="text-sm text-error">部位マスタが未登録です</div>
          )}
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
