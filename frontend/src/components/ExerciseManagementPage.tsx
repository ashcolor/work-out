import { Fragment } from "react";
import type { Exercise } from "../types";
import { SectionLabel } from "./SectionLabel";
import { groupExercisesByTag } from "../utils/groupExercisesByTag";

type Props = {
  exercises: Exercise[];
  onAddExercise: () => void;
};

export function ExerciseManagementPage({ exercises, onAddExercise }: Props) {
  const groups = groupExercisesByTag(exercises);

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
              </tr>
            </thead>
            <tbody>
              {groups.length === 0 ? (
                <tr>
                  <td className="py-8 text-center text-base-content/50">種目はまだありません</td>
                </tr>
              ) : (
                groups.map((group) => (
                  <Fragment key={group.tag}>
                    <tr className="bg-base-200/60">
                      <td className="py-2">
                        <SectionLabel label={group.tag} />
                      </td>
                    </tr>
                    {group.exercises.map((exercise) => (
                      <tr key={exercise.id} className="hover:bg-base-200">
                        <td className="font-medium">{exercise.name}</td>
                      </tr>
                    ))}
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
