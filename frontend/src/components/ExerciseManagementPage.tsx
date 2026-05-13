import { useState, type KeyboardEvent } from "react";
import { Icon } from "@iconify/react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { reorderExercises, updateExerciseName, updateExerciseWeightStep } from "../api";
import type { Exercise } from "../types";
import { groupExercisesByTag } from "../utils/groupExercisesByTag";

type Props = {
  exercises: Exercise[];
  onWeightStepChanged: (exerciseId: number, weightStep: number) => void;
  onNameChanged: (exerciseId: number, name: string) => void;
  onOrderChanged: (orderedIds: number[]) => void;
};

type EditField = "name" | "step";
type EditingState = { id: number; field: EditField } | null;

function formatStepValue(value: number) {
  return value.toFixed(2).replace(/\.?0+$/, "");
}

function parseStep(value: string): number | null {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return null;
  return num;
}

type SortableExerciseRowProps = {
  exercise: Exercise;
  isEditingName: boolean;
  isEditingStep: boolean;
  draftValue: string;
  isSaving: boolean;
  isAnySaving: boolean;
  onStartEditName: () => void;
  onStartEditStep: () => void;
  onChangeDraft: (value: string) => void;
  onSave: () => void;
  onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
};

function SortableExerciseRow({
  exercise,
  isEditingName,
  isEditingStep,
  draftValue,
  isSaving,
  isAnySaving,
  onStartEditName,
  onStartEditStep,
  onChangeDraft,
  onSave,
  onKeyDown,
}: SortableExerciseRowProps) {
  const isEditing = isEditingName || isEditingStep;
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: exercise.id, disabled: isEditing });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={`flex items-center gap-2 rounded-lg bg-base-100 px-3 py-2 shadow-sm ${
        isDragging ? "z-10 opacity-50" : ""
      }`}
    >
      <div className="min-w-0 flex-1">
        {isEditingName ? (
          <input
            type="text"
            className="input input-bordered input-sm h-8 min-h-8 w-full"
            value={draftValue}
            onChange={(event) => onChangeDraft(event.target.value)}
            onBlur={onSave}
            onKeyDown={onKeyDown}
            disabled={isSaving}
            autoFocus
          />
        ) : (
          <button
            type="button"
            className="w-full truncate rounded px-2 py-1 text-left font-medium transition hover:bg-base-200/70"
            onClick={onStartEditName}
            disabled={isAnySaving}
          >
            {exercise.name}
          </button>
        )}
      </div>

      <div className="shrink-0">
        {isEditingStep ? (
          <div className="relative w-24">
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              className="input input-bordered input-sm h-8 min-h-8 w-full pr-7 text-right"
              value={draftValue}
              onChange={(event) => onChangeDraft(event.target.value)}
              onBlur={onSave}
              onKeyDown={onKeyDown}
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
            onClick={onStartEditStep}
            disabled={isAnySaving}
          >
            {formatStepValue(exercise.weightStep)}kg
          </button>
        )}
      </div>

      <span
        ref={setActivatorNodeRef}
        {...listeners}
        className="flex shrink-0 cursor-grab touch-none items-center justify-center px-1 text-base-content/40"
        aria-label="並び替え"
        title="ドラッグで並び替え"
      >
        <Icon icon="fa6-solid:grip-lines" className="size-5" />
      </span>
    </li>
  );
}

export function ExerciseManagementPage({
  exercises,
  onWeightStepChanged,
  onNameChanged,
  onOrderChanged,
}: Props) {
  const groups = groupExercisesByTag(exercises);
  const [editing, setEditing] = useState<EditingState>(null);
  const [draftValue, setDraftValue] = useState("");
  const [savingId, setSavingId] = useState<number | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const startEditingName = (exercise: Exercise) => {
    setEditing({ id: exercise.id, field: "name" });
    setDraftValue(exercise.name);
  };

  const startEditingStep = (exercise: Exercise) => {
    setEditing({ id: exercise.id, field: "step" });
    setDraftValue(formatStepValue(exercise.weightStep));
  };

  const cancelEditing = () => {
    setEditing(null);
    setDraftValue("");
  };

  const handleSave = async () => {
    if (editing == null) return;
    const target = exercises.find((exercise) => exercise.id === editing.id);
    if (!target) {
      cancelEditing();
      return;
    }

    if (editing.field === "step") {
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
      return;
    }

    const trimmed = draftValue.trim();
    if (trimmed === "" || trimmed === target.name) {
      cancelEditing();
      return;
    }
    setSavingId(target.id);
    try {
      await updateExerciseName(target.id, trimmed);
      onNameChanged(target.id, trimmed);
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

  const handleDragEnd = (groupExercises: Exercise[]) => (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const fromIdx = groupExercises.findIndex((exercise) => exercise.id === active.id);
    const toIdx = groupExercises.findIndex((exercise) => exercise.id === over.id);
    if (fromIdx === -1 || toIdx === -1) return;

    const next = groupExercises.slice();
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    const orderedIds = next.map((exercise) => exercise.id);
    onOrderChanged(orderedIds);
    void reorderExercises(orderedIds);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">種目</h2>
        <p className="text-sm text-base-content/60">登録されている種目一覧</p>
      </div>

      {groups.length === 0 ? (
        <div className="card bg-base-100 py-8 text-center text-base-content/50 shadow">
          種目はまだありません
        </div>
      ) : (
        groups.map((group) => (
          <section key={group.tag} className="space-y-2">
            <h3 className="text-base font-semibold text-base-content">{group.tag}</h3>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd(group.exercises)}
            >
              <SortableContext
                items={group.exercises.map((exercise) => exercise.id)}
                strategy={verticalListSortingStrategy}
              >
                <ul className="flex flex-col gap-2">
                  {group.exercises.map((exercise) => (
                    <SortableExerciseRow
                      key={exercise.id}
                      exercise={exercise}
                      isEditingName={
                        editing?.id === exercise.id && editing.field === "name"
                      }
                      isEditingStep={
                        editing?.id === exercise.id && editing.field === "step"
                      }
                      draftValue={draftValue}
                      isSaving={savingId === exercise.id}
                      isAnySaving={savingId != null}
                      onStartEditName={() => startEditingName(exercise)}
                      onStartEditStep={() => startEditingStep(exercise)}
                      onChangeDraft={setDraftValue}
                      onSave={() => void handleSave()}
                      onKeyDown={handleKeyDown}
                    />
                  ))}
                </ul>
              </SortableContext>
            </DndContext>
          </section>
        ))
      )}
    </div>
  );
}
