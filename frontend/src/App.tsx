import { useState, useEffect, useCallback } from "react";
import { fetchExercises, checkAuth, logout } from "./api";
import { ALL_TAGS } from "./types";
import type { Exercise } from "./types";
import { AppHeader } from "./components/AppHeader";
import { AppSidebar } from "./components/AppSidebar";
import { ExerciseTable } from "./components/ExerciseTable";
import { AddExerciseModal } from "./components/AddExerciseModal";
import { LogModal } from "./components/LogModal";
import { HistoryModal } from "./components/HistoryModal";
import { LoginPage } from "./components/LoginPage";

const TAG_ORDER = new Map(ALL_TAGS.map((tag, index) => [tag, index]));

export default function App() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [logTarget, setLogTarget] = useState<Exercise | null>(null);
  const [historyTarget, setHistoryTarget] = useState<Exercise | null>(null);

  useEffect(() => {
    checkAuth().then(setAuthenticated);
  }, []);

  const reload = useCallback(async () => {
    const data = await fetchExercises();
    const sorted = [...data].sort((a, b) => {
      const tagA = TAG_ORDER.get(a.tag) ?? Number.MAX_SAFE_INTEGER;
      const tagB = TAG_ORDER.get(b.tag) ?? Number.MAX_SAFE_INTEGER;
      if (tagA !== tagB) return tagA - tagB;
      return a.name.localeCompare(b.name, "ja");
    });
    setExercises(sorted);
  }, []);

  useEffect(() => {
    if (authenticated) reload();
  }, [authenticated, reload]);

  if (authenticated === null) {
    return <div className="min-h-screen bg-base-200 flex items-center justify-center">
      <span className="loading loading-spinner loading-lg"></span>
    </div>;
  }

  if (!authenticated) {
    return <LoginPage onLogin={() => setAuthenticated(true)} />;
  }

  const handleLogout = async () => {
    setSidebarOpen(false);
    await logout();
    setAuthenticated(false);
  };

  const handleOpenExercises = () => {
    setSidebarOpen(false);
    setShowAddExercise(true);
  };

  return (
    <div className="min-h-screen bg-base-200">
      <AppHeader
        onMenuOpen={() => setSidebarOpen(true)}
        onOpenExercises={handleOpenExercises}
      />
      <AppSidebar
        open={sidebarOpen}
        exerciseCount={exercises.length}
        onClose={() => setSidebarOpen(false)}
        onOpenExercises={handleOpenExercises}
        onLogout={handleLogout}
      />

      <div className="max-w-3xl mx-auto p-4 sm:p-6">
        <ExerciseTable
          exercises={exercises}
          onLog={setLogTarget}
          onHistory={setHistoryTarget}
        />

        {showAddExercise && (
          <AddExerciseModal
            exercises={exercises}
            onClose={() => setShowAddExercise(false)}
            onChanged={reload}
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
