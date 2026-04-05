import type { BodyPart, Exercise } from "../types";

type Props = {
  bodyParts: BodyPart[];
  exercises: Exercise[];
  onBack: () => void;
};

export function BodyPartsPage({ bodyParts, exercises, onBack }: Props) {
  const exerciseCountByBodyPart = new Map<string, number>();

  for (const exercise of exercises) {
    exerciseCountByBodyPart.set(
      exercise.tag,
      (exerciseCountByBodyPart.get(exercise.tag) ?? 0) + 1
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">部位</h2>
          <p className="text-sm text-base-content/60">登録されている部位一覧</p>
        </div>
        <button type="button" className="btn btn-ghost btn-sm" onClick={onBack}>
          種目一覧へ
        </button>
      </div>

      <div className="card bg-base-100 shadow">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>部位</th>
                <th>並び順</th>
                <th>種目数</th>
              </tr>
            </thead>
            <tbody>
              {bodyParts.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-base-content/50">
                    部位はまだありません
                  </td>
                </tr>
              ) : (
                bodyParts.map((bodyPart) => (
                  <tr key={bodyPart.id} className="hover:bg-base-200">
                    <td className="font-medium">{bodyPart.name}</td>
                    <td>{bodyPart.sortOrder}</td>
                    <td>{exerciseCountByBodyPart.get(bodyPart.name) ?? 0}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
