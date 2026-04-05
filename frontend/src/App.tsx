import { useCallback, useEffect, useState } from "react";
import { checkAuth, fetchBodyParts, fetchExercises, logout } from "./api";
import type { BodyPart, Exercise } from "./types";
import { AppHeader } from "./components/AppHeader";
import { AppSidebar } from "./components/AppSidebar";
import { ExerciseTable } from "./components/ExerciseTable";
import { AddExerciseModal } from "./components/AddExerciseModal";
import { BodyPartsPage } from "./components/BodyPartsPage";
import { ExerciseManagementPage } from "./components/ExerciseManagementPage";
import { LogModal } from "./components/LogModal";
import { HistoryModal } from "./components/HistoryModal";
import { LoginPage } from "./components/LoginPage";

type View = "records" | "exercises" | "bodyParts";

export default function App() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [bodyParts, setBodyParts] = useState<BodyPart[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [currentView, setCurrentView] = useState<View>("records");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [logTarget, setLogTarget] = useState<Exercise | null>(null);
  const [historyTarget, setHistoryTarget] = useState<Exercise | null>(null);

  useEffect(() => {
    checkAuth().then(setAuthenticated);
  }, []);

  const reload = useCallback(async () => {
    const [bodyPartData, exerciseData] = await Promise.all([
      fetchBodyParts(),
      fetchExercises(),
    ]);

    const tagOrder = new Map(bodyPartData.map((bodyPart) => [bodyPart.name, bodyPart.sortOrder]));
    const sortedExercises = [...exerciseData].sort((a, b) => {
      const tagA = tagOrder.get(a.tag) ?? Number.MAX_SAFE_INTEGER;
      const tagB = tagOrder.get(b.tag) ?? Number.MAX_SAFE_INTEGER;
      if (tagA !== tagB) return tagA - tagB;
      return a.name.localeCompare(b.name, "ja");
    });

    setBodyParts(bodyPartData);
    setExercises(sortedExercises);
  }, []);

  useEffect(() => {
    if (authenticated) {
      reload();
    }
  }, [authenticated, reload]);

  if (authenticated === null) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
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
    setCurrentView("exercises");
  };

  const handleOpenAddExercise = () => {
    setCurrentView("exercises");
    setShowAddExercise(true);
  };

  const handleOpenBodyParts = () => {
    setSidebarOpen(false);
    setCurrentView("bodyParts");
  };

  const handleOpenRecords = () => {
    setSidebarOpen(false);
    setCurrentView("records");
  };

  const handleBackToExercises = () => {
    setCurrentView("records");
  };

  return (
    <div className="min-h-screen bg-base-200">
      <AppHeader
        onMenuOpen={() => setSidebarOpen(true)}
        onOpenExercises={handleOpenAddExercise}
      />
      <AppSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onOpenRecords={handleOpenRecords}
        onOpenBodyParts={handleOpenBodyParts}
        onOpenExercises={handleOpenExercises}
        onLogout={handleLogout}
      />

      <div className="max-w-3xl mx-auto p-4 sm:p-6">
        {currentView === "bodyParts" ? (
          <BodyPartsPage
            bodyParts={bodyParts}
            exercises={exercises}
            onBack={handleBackToExercises}
          />
        ) : currentView === "exercises" ? (
          <ExerciseManagementPage
            exercises={exercises}
            onAddExercise={handleOpenAddExercise}
          />
        ) : (
          <ExerciseTable
            exercises={exercises}
            onLog={setLogTarget}
            onHistory={setHistoryTarget}
          />
        )}

        {showAddExercise && (
          <AddExerciseModal
            bodyParts={bodyParts}
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
