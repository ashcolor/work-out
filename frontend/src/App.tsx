import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchBodyParts, fetchExercises } from "./api";
import type { BodyPart, Exercise, WorkoutLog } from "./types";
import { AddExerciseModal } from "./components/AddExerciseModal";
import { AppHeader } from "./components/AppHeader";
import { AppSidebar } from "./components/AppSidebar";
import { BodyPartsPage } from "./components/BodyPartsPage";
import { DataManagementModal } from "./components/DataManagementModal";
import { ExerciseManagementPage } from "./components/ExerciseManagementPage";
import { ExerciseTable } from "./components/ExerciseTable";
import { HistoryModal } from "./components/HistoryModal";
import { LogModal } from "./components/LogModal";

type View = "records" | "exercises" | "bodyParts";
type LogEntry = WorkoutLog & { id?: number };

function sortExercises(exercises: Exercise[], bodyParts: BodyPart[]) {
  const tagOrder = new Map(bodyParts.map((bodyPart) => [bodyPart.name, bodyPart.sortOrder]));

  return [...exercises].sort((a, b) => {
    const tagA = tagOrder.get(a.tag) ?? Number.MAX_SAFE_INTEGER;
    const tagB = tagOrder.get(b.tag) ?? Number.MAX_SAFE_INTEGER;
    if (tagA !== tagB) return tagA - tagB;
    return a.name.localeCompare(b.name, "ja");
  });
}

function sortLogsByDate(logs: LogEntry[]) {
  return [...logs].sort((a, b) => {
    const dateDiff = b.date.localeCompare(a.date);
    if (dateDiff !== 0) return dateDiff;
    return (b.id ?? 0) - (a.id ?? 0);
  });
}

function getRecentLogs(logs: LogEntry[]) {
  return sortLogsByDate(logs).slice(0, 3);
}

export default function App() {
  const [bodyParts, setBodyParts] = useState<BodyPart[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [hasLoadedData, setHasLoadedData] = useState(false);
  const [currentView, setCurrentView] = useState<View>("records");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [showDataManagement, setShowDataManagement] = useState(false);
  const [logTargetId, setLogTargetId] = useState<number | null>(null);
  const [historyTargetId, setHistoryTargetId] = useState<number | null>(null);

  const reload = useCallback(async () => {
    const [bodyPartData, exerciseData] = await Promise.all([
      fetchBodyParts(),
      fetchExercises(),
    ]);

    setBodyParts(bodyPartData);
    setExercises(sortExercises(exerciseData, bodyPartData));
    setHasLoadedData(true);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const logTarget = useMemo(
    () => exercises.find((exercise) => exercise.id === logTargetId) ?? null,
    [exercises, logTargetId]
  );

  const historyTarget = useMemo(
    () => exercises.find((exercise) => exercise.id === historyTargetId) ?? null,
    [exercises, historyTargetId]
  );

  const updateExercise = useCallback((exerciseId: number, updater: (exercise: Exercise) => Exercise) => {
    setExercises((current) =>
      current.map((exercise) => (exercise.id === exerciseId ? updater(exercise) : exercise))
    );
  }, []);

  const handleExerciseAdded = useCallback(
    (exercise: Exercise) => {
      setExercises((current) => sortExercises([...current, exercise], bodyParts));
    },
    [bodyParts]
  );

  const handleLogAdded = useCallback(
    (exerciseId: number, log: LogEntry) => {
      updateExercise(exerciseId, (exercise) => ({
        ...exercise,
        recentLogs: getRecentLogs([log, ...exercise.recentLogs]),
      }));
    },
    [updateExercise]
  );

  const handleHistoryLogsChanged = useCallback(
    (exerciseId: number, logs: Array<WorkoutLog & { id: number }>) => {
      updateExercise(exerciseId, (exercise) => ({
        ...exercise,
        recentLogs: getRecentLogs(logs),
      }));
    },
    [updateExercise]
  );

  if (!hasLoadedData) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <span className="loading loading-spinner loading-lg" aria-label="データを読み込み中" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200">
      <AppHeader
        onMenuOpen={() => setSidebarOpen(true)}
        onOpenExercises={() => {
          setCurrentView("exercises");
          setShowAddExercise(true);
        }}
      />
      <AppSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onOpenRecords={() => {
          setSidebarOpen(false);
          setCurrentView("records");
        }}
        onOpenBodyParts={() => {
          setSidebarOpen(false);
          setCurrentView("bodyParts");
        }}
        onOpenExercises={() => {
          setSidebarOpen(false);
          setCurrentView("exercises");
        }}
        onOpenDataManagement={() => {
          setSidebarOpen(false);
          setShowDataManagement(true);
        }}
      />

      <div className="relative max-w-3xl mx-auto p-4 sm:p-6">
        {currentView === "bodyParts" ? (
          <BodyPartsPage
            bodyParts={bodyParts}
            exercises={exercises}
            onBack={() => setCurrentView("records")}
          />
        ) : currentView === "exercises" ? (
          <ExerciseManagementPage
            exercises={exercises}
            onAddExercise={() => setShowAddExercise(true)}
            onWeightStepChanged={(exerciseId, weightStep) =>
              updateExercise(exerciseId, (exercise) => ({ ...exercise, weightStep }))
            }
          />
        ) : (
          <ExerciseTable
            exercises={exercises}
            onLog={(exercise) => setLogTargetId(exercise.id)}
            onHistory={(exercise) => setHistoryTargetId(exercise.id)}
          />
        )}

        {showAddExercise && (
          <AddExerciseModal
            bodyParts={bodyParts}
            onClose={() => setShowAddExercise(false)}
            onAdded={(exercise) => {
              handleExerciseAdded(exercise);
              setShowAddExercise(false);
            }}
          />
        )}

        {logTarget && (
          <LogModal
            exercise={logTarget}
            onClose={() => setLogTargetId(null)}
            onAdded={(log) => handleLogAdded(logTarget.id, log)}
          />
        )}

        {historyTarget && (
          <HistoryModal
            exercise={historyTarget}
            onClose={() => setHistoryTargetId(null)}
            onLogsChanged={(logs) => handleHistoryLogsChanged(historyTarget.id, logs)}
          />
        )}

        {showDataManagement && (
          <DataManagementModal
            onClose={() => setShowDataManagement(false)}
            onImported={() => {
              setShowDataManagement(false);
              void reload();
            }}
          />
        )}
      </div>
    </div>
  );
}
