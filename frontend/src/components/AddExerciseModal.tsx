import { Fragment, useState } from "react";
import { addExercise } from "../api";
import type { Exercise } from "../types";
import { ALL_TAGS } from "../types";
import { TagBadge } from "./TagBadge";
import { SectionLabel } from "./SectionLabel";
import { groupExercisesByTag } from "../utils/groupExercisesByTag";

type Props = {
  exercises: Exercise[];
  onClose: () => void;
  onChanged: () => Promise<void>;
};

export function AddExerciseModal({ exercises, onClose, onChanged }: Props) {
  const [name, setName] = useState("");
  const [tag, setTag] = useState(ALL_TAGS[0]);
  const groups = groupExercisesByTag(exercises);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await addExercise(name.trim(), tag);
    setName("");
    await onChanged();
  };

  return (
    <dialog className="modal modal-open">
      <div className="modal-box max-w-xl">
        <h3 className="font-bold text-lg mb-4">種目</h3>
        <div className="mb-5">
          <div className="max-h-72 overflow-y-auto rounded-box border border-base-300 bg-base-100">
            {exercises.length === 0 ? (
              <div className="px-4 py-6 text-sm text-base-content/50">
                種目はまだありません
              </div>
            ) : (
              <table className="table table-sm">
                <tbody>
                  {groups.map((group) => (
                    <Fragment key={group.tag}>
                      <tr className="bg-base-200/60">
                        <td className="py-2">
                          <SectionLabel label={group.tag} />
                        </td>
                      </tr>
                      {group.exercises.map((exercise) => (
                        <tr key={exercise.id}>
                          <td>
                            <span className="font-medium">{exercise.name}</span>
                          </td>
                        </tr>
                      ))}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="mb-3 text-sm font-medium text-base-content/70">
          種目を追加
        </div>
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
              閉じる
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
