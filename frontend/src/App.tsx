import { useState, useEffect, useCallback } from "react";
import { fetchExercises } from "./api";
import type { Exercise } from "./types";
import { ExerciseTable } from "./components/ExerciseTable";
import { AddExerciseModal } from "./components/AddExerciseModal";
import { LogModal } from "./components/LogModal";
import { HistoryModal } from "./components/HistoryModal";

export default function App() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [logTarget, setLogTarget] = useState<Exercise | null>(null);
  const [historyTarget, setHistoryTarget] = useState<Exercise | null>(null);

  const reload = useCallback(async () => {
    const data = await fetchExercises();
    setExercises(data);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return (
    <div className="min-h-screen bg-base-200">
      <div className="max-w-3xl mx-auto p-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">筋トレ</h1>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setShowAddExercise(true)}
          >
            + 種目追加
          </button>
        </div>

        <ExerciseTable
          exercises={exercises}
          onLog={setLogTarget}
          onHistory={setHistoryTarget}
          onDelete={reload}
        />

        {showAddExercise && (
          <AddExerciseModal
            onClose={() => setShowAddExercise(false)}
            onAdded={reload}
          />
        )}

        {logTarget && (
          <LogModal
            exercise={logTarget}
            onClose={() => setLogTarget(null)}
            onAdded={reload}
          />
        )}

        {historyTarget && (
          <HistoryModal
            exercise={historyTarget}
            onClose={() => setHistoryTarget(null)}
          />
        )}
      </div>
    </div>
  );
}
