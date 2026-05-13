import { Fragment, useState, type KeyboardEvent } from "react";
import { updateExerciseWeightStep } from "../api";
import type { Exercise } from "../types";
import { SectionLabel } from "./SectionLabel";
import { groupExercisesByTag } from "../utils/groupExercisesByTag";

type Props = {
  exercises: Exercise[];
  onAddExercise: () => void;
  onWeightStepChanged: (exerciseId: number, weightStep: number) => void;
};

function formatStepValue(value: number) {
  return value.toFixed(2).replace(/\.?0+$/, "");
}

function parseStep(value: string): number | null {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return null;
  return num;
}

export function ExerciseManagementPage({ exercises, onAddExercise, onWeightStepChanged }: Props) {
  const groups = groupExercisesByTag(exercises);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draftValue, setDraftValue] = useState("");
  const [savingId, setSavingId] = useState<number | null>(null);

  const startEditing = (exercise: Exercise) => {
    setEditingId(exercise.id);
    setDraftValue(formatStepValue(exercise.weightStep));
  };

  const cancelEditing = () => {
    setEditingId(null);
    setDraftValue("");
  };

  const handleSave = async () => {
    if (editingId == null) return;
    const target = exercises.find((exercise) => exercise.id === editingId);
    if (!target) {
      cancelEditing();
      return;
    }

    const parsed = parseStep(draftValue);
    if (parsed == null) {
      cancelEditing();
      return;
    }

    setSavingId(target.id);
    try {
      await updateExerciseWeightStep(target.id, parsed);
      onWeightStepChanged(target.id, parsed);
      cancelEditing();
    } finally {
      setSavingId(null);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      void handleSave();
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      cancelEditing();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">種目</h2>
          <p className="text-sm text-base-content/60">登録されている種目一覧</p>
        </div>
        <button type="button" className="btn btn-primary btn-sm" onClick={onAddExercise}>
          追加
        </button>
      </div>

      <div className="card bg-base-100 shadow">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>種目</th>
                <th className="text-right">ステップ</th>
              </tr>
            </thead>
            <tbody>
              {groups.length === 0 ? (
                <tr>
                  <td className="py-8 text-center text-base-content/50" colSpan={2}>
                    種目はまだありません
                  </td>
                </tr>
              ) : (
                groups.map((group) => (
                  <Fragment key={group.tag}>
                    <tr className="bg-base-200/60">
                      <td className="py-2" colSpan={2}>
                        <SectionLabel label={group.tag} />
                      </td>
                    </tr>
                    {group.exercises.map((exercise) => {
                      const isEditing = editingId === exercise.id;
                      const isSaving = savingId === exercise.id;
                      return (
                        <tr key={exercise.id} className="hover:bg-base-200">
                          <td className="font-medium">{exercise.name}</td>
                          <td>
                            <div className="flex justify-end">
                              {isEditing ? (
                                <div className="relative w-24">
                                  <input
                                    type="number"
                                    inputMode="decimal"
                                    step="0.01"
                                    min="0"
                                    className="input input-bordered input-xs h-7 min-h-7 w-full pr-7 text-right"
                                    value={draftValue}
                                    onChange={(event) => setDraftValue(event.target.value)}
                                    onBlur={() => void handleSave()}
                                    onKeyDown={handleKeyDown}
                                    disabled={isSaving}
                                    autoFocus
                                  />
                                  <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-[10px] text-base-content/60">
                                    kg
                                  </span>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  className="w-24 rounded px-2 py-1 text-right text-sm tabular-nums transition hover:bg-base-200/70"
                                  onClick={() => startEditing(exercise)}
                                  disabled={savingId != null}
                                >
                                  {formatStepValue(exercise.weightStep)}kg
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
