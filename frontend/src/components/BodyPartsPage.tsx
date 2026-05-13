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
import { reorderBodyParts, updateBodyPartName } from "../api";
import type { BodyPart, Exercise } from "../types";

type Props = {
  bodyParts: BodyPart[];
  exercises: Exercise[];
  onNameChanged: (bodyPartId: number, name: string) => void;
  onOrderChanged: (orderedIds: number[]) => void;
};

type SortableRowProps = {
  bodyPart: BodyPart;
  exerciseCount: number;
  isEditing: boolean;
  draftValue: string;
  isSaving: boolean;
  isAnySaving: boolean;
  onStartEdit: () => void;
  onChangeDraft: (value: string) => void;
  onSave: () => void;
  onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
};

function SortableBodyPartRow({
  bodyPart,
  exerciseCount,
  isEditing,
  draftValue,
  isSaving,
  isAnySaving,
  onStartEdit,
  onChangeDraft,
  onSave,
  onKeyDown,
}: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: bodyPart.id, disabled: isEditing });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={`flex items-center gap-3 rounded-lg bg-base-100 px-3 py-2 shadow-sm ${
        isDragging ? "z-10 opacity-50" : ""
      }`}
    >
      <div className="min-w-0 flex-1">
        {isEditing ? (
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
            onClick={onStartEdit}
            disabled={isAnySaving}
          >
            {bodyPart.name}
          </button>
        )}
      </div>

      <span className="shrink-0 text-sm text-base-content/60 tabular-nums">
        {exerciseCount}種目
      </span>

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

export function BodyPartsPage({
  bodyParts,
  exercises,
  onNameChanged,
  onOrderChanged,
}: Props) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draftValue, setDraftValue] = useState("");
  const [savingId, setSavingId] = useState<number | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const exerciseCountByBodyPart = new Map<string, number>();
  for (const exercise of exercises) {
    exerciseCountByBodyPart.set(
      exercise.tag,
      (exerciseCountByBodyPart.get(exercise.tag) ?? 0) + 1
    );
  }

  const startEditing = (bodyPart: BodyPart) => {
    setEditingId(bodyPart.id);
    setDraftValue(bodyPart.name);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setDraftValue("");
  };

  const handleSave = async () => {
    if (editingId == null) return;
    const target = bodyParts.find((bp) => bp.id === editingId);
    if (!target) {
      cancelEditing();
      return;
    }

    const trimmed = draftValue.trim();
    if (trimmed === "" || trimmed === target.name) {
      cancelEditing();
      return;
    }

    setSavingId(target.id);
    try {
      await updateBodyPartName(target.id, trimmed);
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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const fromIdx = bodyParts.findIndex((bp) => bp.id === active.id);
    const toIdx = bodyParts.findIndex((bp) => bp.id === over.id);
    if (fromIdx === -1 || toIdx === -1) return;

    const next = bodyParts.slice();
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    const orderedIds = next.map((bp) => bp.id);
    onOrderChanged(orderedIds);
    void reorderBodyParts(orderedIds);
  };

  const sortableIds = bodyParts.map((bp) => bp.id);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold">部位</h2>
      </div>

      {bodyParts.length === 0 ? (
        <div className="card bg-base-100 py-8 text-center text-base-content/50 shadow">
          部位はまだありません
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
            <ul className="flex flex-col gap-2">
              {bodyParts.map((bodyPart) => (
                <SortableBodyPartRow
                  key={bodyPart.id}
                  bodyPart={bodyPart}
                  exerciseCount={exerciseCountByBodyPart.get(bodyPart.name) ?? 0}
                  isEditing={editingId === bodyPart.id}
                  draftValue={draftValue}
                  isSaving={savingId === bodyPart.id}
                  isAnySaving={savingId != null}
                  onStartEdit={() => startEditing(bodyPart)}
                  onChangeDraft={setDraftValue}
                  onSave={() => void handleSave()}
                  onKeyDown={handleKeyDown}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
