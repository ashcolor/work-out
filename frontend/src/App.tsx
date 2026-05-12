import { useCallback, useEffect, useMemo, useState } from "react";
import { checkAuth, fetchBodyParts, fetchExercises, logout } from "./api";
import type { BodyPart, Exercise, WorkoutLog } from "./types";
import { AddExerciseModal } from "./components/AddExerciseModal";
import { AppHeader } from "./components/AppHeader";
import { AppSidebar } from "./components/AppSidebar";
import { BodyPartsPage } from "./components/BodyPartsPage";
import { ExerciseManagementPage } from "./components/ExerciseManagementPage";
import { ExerciseTable } from "./components/ExerciseTable";
import { HistoryModal } from "./components/HistoryModal";
import { LogModal } from "./components/LogModal";
import { LoginPage } from "./components/LoginPage";

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
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [bodyParts, setBodyParts] = useState<BodyPart[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [hasLoadedData, setHasLoadedData] = useState(false);
  const [currentView, setCurrentView] = useState<View>("records");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [logTargetId, setLogTargetId] = useState<number | null>(null);
  const [historyTargetId, setHistoryTargetId] = useState<number | null>(null);

  useEffect(() => {
    checkAuth().then(setAuthenticated);
  }, []);

  const reload = useCallback(async () => {
    setLoadingData(true);
    try {
      const [bodyPartData, exerciseData] = await Promise.all([
        fetchBodyParts(),
        fetchExercises(),
      ]);

      setBodyParts(bodyPartData);
      setExercises(sortExercises(exerciseData, bodyPartData));
      setHasLoadedData(true);
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (authenticated) {
      void reload();
    }
  }, [authenticated, reload]);

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

  if (authenticated === null) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  if (!authenticated) {
    return <LoginPage onLogin={() => setAuthenticated(true)} />;
  }

  if (!hasLoadedData) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <span className="loading loading-spinner loading-lg" aria-label="データを読み込み中" />
      </div>
    );
  }

  const handleLogout = async () => {
    setSidebarOpen(false);
    await logout();
    setHasLoadedData(false);
    setAuthenticated(false);
  };

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
        onLogout={() => void handleLogout()}
      />

      <div className="relative max-w-3xl mx-auto p-4 sm:p-6">
        {loadingData && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-[2rem] bg-base-200/70">
            <span className="loading loading-spinner loading-lg" aria-label="データを読み込み中" />
          </div>
        )}

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
      </div>
    </div>
  );
}
