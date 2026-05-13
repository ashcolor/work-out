import { useState, type FormEvent } from "react";
import { addBodyPart } from "../api";
import type { BodyPart } from "../types";

type Props = {
  onClose: () => void;
  onAdded: (bodyPart: BodyPart) => void;
};

export function AddBodyPartModal({ onClose, onAdded }: Props) {
  const [name, setName] = useState("");

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    const created = await addBodyPart(trimmed);
    onAdded(created);
  };

  return (
    <dialog className="modal modal-open">
      <div className="modal-box max-w-md">
        <h3 className="mb-4 text-lg font-bold">部位を追加</h3>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="text"
            placeholder="部位名"
            className="input input-bordered w-full"
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoFocus
          />
          <div className="modal-action">
            <button type="button" className="btn" onClick={onClose}>
              閉じる
            </button>
            <button type="submit" className="btn btn-primary" disabled={!name.trim()}>
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
