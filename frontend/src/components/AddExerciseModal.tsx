import { useState } from "react";
import { addExercise } from "../api";
import { ALL_TAGS } from "../types";

type Props = {
  onClose: () => void;
  onAdded: () => void;
};

export function AddExerciseModal({ onClose, onAdded }: Props) {
  const [name, setName] = useState("");
  const [tag, setTag] = useState(ALL_TAGS[0]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await addExercise(name.trim(), tag);
    onAdded();
    onClose();
  };

  return (
    <dialog className="modal modal-open">
      <div className="modal-box">
        <h3 className="font-bold text-lg mb-4">種目を追加</h3>
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
            value={tag}
            onChange={(e) => setTag(e.target.value)}
          >
            {ALL_TAGS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <div className="modal-action">
            <button type="button" className="btn" onClick={onClose}>
              キャンセル
            </button>
            <button type="submit" className="btn btn-primary">
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
