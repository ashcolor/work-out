import { Icon } from "@iconify/react";
import { useEffect, useState } from "react";
import type { KeyboardEvent } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { deleteLog, fetchLogs, updateLog } from "../api";
import type { Exercise, WorkoutLog } from "../types";
import { formatWeight } from "../utils/formatWeight";
import { TagBadge } from "./TagBadge";

type Props = {
  exercise: Exercise;
  onClose: () => void;
  onLogsChanged: (logs: Array<WorkoutLog & { id: number }>) => void;
};

type LogEntry = WorkoutLog & { id: number };
type EditableField = "date" | "weight" | "reps";
type EditingCell = {
  id: number;
  field: EditableField;
};

type ChartPoint = {
  id: number;
  date: string;
  shortDate: string;
  weight: number;
};

const PRIMARY_COLOR = "var(--color-primary)";

function formatAbsoluteDate(value: string) {
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return value;
  return `${year}/${month}/${day}`;
}

function formatShortDate(value: string) {
  const [, month, day] = value.split("-");
  if (!month || !day) return value;
  return `${month}/${day}`;
}

function formatEditableValue(log: LogEntry, field: EditableField) {
  if (field === "date") return log.date;
  if (field === "weight") return log.weight == null ? "" : String(log.weight);
  return log.reps == null ? "" : String(log.reps);
}

function sortLogsByDate(logs: LogEntry[]) {
  return [...logs].sort((a, b) => {
    const dateDiff = b.date.localeCompare(a.date);
    if (dateDiff !== 0) return dateDiff;
    return b.id - a.id;
  });
}

function buildChartData(logs: LogEntry[]): ChartPoint[] {
  return logs
    .filter((log): log is LogEntry & { weight: number } => log.weight != null)
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((log) => ({
      id: log.id,
      date: log.date,
      shortDate: formatShortDate(log.date),
      weight: log.weight,
    }));
}

function WeightTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: ChartPoint }>;
}) {
  if (!active || !payload?.length) return null;

  const point = payload[0].payload;

  return (
    <div className="rounded-xl border border-base-300 bg-base-100 px-3 py-2 text-sm shadow-lg">
      <div className="text-base-content/60">{formatAbsoluteDate(point.date)}</div>
      <div className="font-semibold">{formatWeight(point.weight)}</div>
    </div>
  );
}

function WeightChart({ logs }: { logs: LogEntry[] }) {
  const chartData = buildChartData(logs);

  if (chartData.length === 0) {
    return (
      <div className="rounded-2xl bg-base-200/60 px-4 py-6 text-sm text-base-content/55">
        重量の記録がまだありません
      </div>
    );
  }

  const maxWeight = Math.max(...chartData.map((point) => point.weight));

  return (
    <div className="rounded-2xl bg-base-200/60 p-4">
      <div className="mb-3 text-sm font-semibold text-base-content/70">
        MAX {formatWeight(maxWeight)}
      </div>
      <div className="h-40 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
            <CartesianGrid stroke="currentColor" strokeOpacity={0.08} vertical={false} />
            <XAxis
              dataKey="shortDate"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "currentColor", fontSize: 11 }}
              className="text-base-content/45"
              minTickGap={20}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: "currentColor", fontSize: 11 }}
              className="text-base-content/45"
              width={56}
              tickFormatter={(value) => `${value}kg`}
              domain={["dataMin - 2", "dataMax + 2"]}
            />
            <Tooltip content={<WeightTooltip />} cursor={{ strokeOpacity: 0.12 }} />
            <Line
              type="monotone"
              dataKey="weight"
              stroke={PRIMARY_COLOR}
              strokeWidth={3}
              isAnimationActive={false}
              dot={{ r: 3, strokeWidth: 0, fill: PRIMARY_COLOR }}
              activeDot={{ r: 5, strokeWidth: 0, fill: PRIMARY_COLOR }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function HistoryModal({ exercise, onClose, onLogsChanged }: Props) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [draftValue, setDraftValue] = useState("");
  const [savingCellKey, setSavingCellKey] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const maxWeight = logs.reduce<number | null>((currentMax, log) => {
    if (log.weight == null) return currentMax;
    if (currentMax == null) return log.weight;
    return Math.max(currentMax, log.weight);
  }, null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchLogs(exercise.id);
      setLogs(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setEditingCell(null);
    setDraftValue("");
    void load();
  }, [exercise.id]);

  const startEditing = (log: LogEntry, field: EditableField) => {
    setEditingCell({ id: log.id, field });
    setDraftValue(formatEditableValue(log, field));
  };

  const cancelEditing = () => {
    setEditingCell(null);
    setDraftValue("");
  };

  const commitLogs = (nextLogs: LogEntry[]) => {
    const sortedLogs = sortLogsByDate(nextLogs);
    setLogs(sortedLogs);
    onLogsChanged(sortedLogs);
  };

  const handleSave = async () => {
    if (!editingCell) return;

    const target = logs.find((log) => log.id === editingCell.id);
    if (!target) {
      cancelEditing();
      return;
    }

    const nextDate = editingCell.field === "date" ? draftValue : target.date;
    const nextWeight =
      editingCell.field === "weight"
        ? draftValue === ""
          ? null
          : Number(draftValue)
        : target.weight;
    const nextReps =
      editingCell.field === "reps"
        ? draftValue === ""
          ? null
          : Number(draftValue)
        : target.reps;

    if (!nextDate) return;
    if (nextWeight != null && Number.isNaN(nextWeight)) return;
    if (nextReps != null && (!Number.isInteger(nextReps) || nextReps < 0)) return;

    const cellKey = `${editingCell.id}:${editingCell.field}`;
    setSavingCellKey(cellKey);
    try {
      await updateLog(target.id, nextWeight, nextReps, nextDate);
      const nextLogs = logs.map((log) =>
        log.id === target.id
          ? { ...log, date: nextDate, weight: nextWeight, reps: nextReps }
          : log
      );
      commitLogs(nextLogs);
      cancelEditing();
    } finally {
      setSavingCellKey(null);
    }
  };

  const handleEditorKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
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

  const handleDelete = async (id: number) => {
    if (!confirm("この記録を削除しますか？")) return;

    setDeletingId(id);
    try {
      await deleteLog(id);
      const nextLogs = logs.filter((log) => log.id !== id);
      commitLogs(nextLogs);
      if (editingCell?.id === id) {
        cancelEditing();
      }
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <dialog className="modal modal-open">
      <div className="modal-box flex h-[calc(100dvh-2rem)] max-h-[calc(100dvh-2rem)] max-w-2xl flex-col overflow-hidden">
        <div className="mb-4 flex items-center gap-2">
          <h3 className="text-lg font-bold">{exercise.name}</h3>
          <TagBadge tag={exercise.tag} />
        </div>

        <div className="min-h-0 flex-1">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <span className="loading loading-spinner loading-lg" aria-label="履歴を読み込み中" />
            </div>
          ) : logs.length === 0 ? (
            <p className="text-base-content/50">記録がありません</p>
          ) : (
            <div className="flex h-full min-h-0 flex-col gap-4">
              <WeightChart logs={logs} />

              <div className="min-h-0 flex-1 overflow-hidden rounded-2xl border border-base-300">
                <div className="h-full overflow-y-auto">
                  <table className="table table-sm table-pin-rows table-fixed">
                    <colgroup>
                      <col className="w-[34%]" />
                      <col className="w-[22%]" />
                      <col className="w-[16%]" />
                      <col className="w-[28%]" />
                    </colgroup>
                    <thead>
                      <tr>
                        <th>日付</th>
                        <th>重量</th>
                        <th>回数</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((log) => {
                        const isDateEditing =
                          editingCell?.id === log.id && editingCell.field === "date";
                        const isWeightEditing =
                          editingCell?.id === log.id && editingCell.field === "weight";
                        const isRepsEditing =
                          editingCell?.id === log.id && editingCell.field === "reps";
                        const isDeleting = deletingId === log.id;
                        const activeCellKey = editingCell
                          ? `${editingCell.id}:${editingCell.field}`
                          : null;
                        const isSaving = savingCellKey === activeCellKey;

                        return (
                          <tr key={log.id}>
                            <td>
                              {isDateEditing ? (
                                <div className="flex items-center gap-1">
                                  <input
                                    type="date"
                                    className="input input-ghost input-xs h-7 min-h-7 w-full rounded-md border border-base-300 px-1 text-xs"
                                    value={draftValue}
                                    onChange={(event) => setDraftValue(event.target.value)}
                                    onBlur={() => void handleSave()}
                                    onKeyDown={handleEditorKeyDown}
                                    disabled={isSaving}
                                    autoFocus
                                  />
                                  {isSaving && <span className="loading loading-spinner loading-xs" />}
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  className="block w-full truncate rounded px-1 py-1 text-left transition hover:bg-base-200/70"
                                  onClick={() => startEditing(log, "date")}
                                  disabled={savingCellKey != null || deletingId != null}
                                >
                                  {formatAbsoluteDate(log.date)}
                                </button>
                              )}
                            </td>
                            <td className={log.weight != null && log.weight === maxWeight ? "font-bold" : undefined}>
                              {isWeightEditing ? (
                                <div className="flex items-center gap-1">
                                  <div className="relative w-full max-w-24">
                                    <input
                                      type="number"
                                      inputMode="decimal"
                                      step="0.01"
                                      className="input input-ghost input-xs h-7 min-h-7 w-full rounded-md border border-base-300 px-1 pr-7 text-right text-xs"
                                      value={draftValue}
                                      onChange={(event) => setDraftValue(event.target.value)}
                                      onBlur={() => void handleSave()}
                                      onKeyDown={handleEditorKeyDown}
                                      disabled={isSaving}
                                      autoFocus
                                    />
                                    <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-[10px] font-normal text-base-content/60">
                                      kg
                                    </span>
                                  </div>
                                  {isSaving && <span className="loading loading-spinner loading-xs" />}
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  className="block w-full truncate rounded px-1 py-1 text-left transition hover:bg-base-200/70"
                                  onClick={() => startEditing(log, "weight")}
                                  disabled={savingCellKey != null || deletingId != null}
                                >
                                  {formatWeight(log.weight)}
                                </button>
                              )}
                            </td>
                            <td>
                              {isRepsEditing ? (
                                <div className="flex items-center gap-1">
                                  <div className="relative w-full max-w-20">
                                    <input
                                      type="number"
                                      inputMode="numeric"
                                      min="0"
                                      step="1"
                                      className="input input-ghost input-xs h-7 min-h-7 w-full rounded-md border border-base-300 px-1 pr-6 text-right text-xs"
                                      value={draftValue}
                                      onChange={(event) => setDraftValue(event.target.value)}
                                      onBlur={() => void handleSave()}
                                      onKeyDown={handleEditorKeyDown}
                                      disabled={isSaving}
                                      autoFocus
                                    />
                                    <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-[10px] text-base-content/60">
                                      回
                                    </span>
                                  </div>
                                  {isSaving && <span className="loading loading-spinner loading-xs" />}
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  className="block w-full truncate rounded px-1 py-1 text-left transition hover:bg-base-200/70"
                                  onClick={() => startEditing(log, "reps")}
                                  disabled={savingCellKey != null || deletingId != null}
                                >
                                  {log.reps != null ? `${log.reps}回` : "-"}
                                </button>
                              )}
                            </td>
                            <td>
                              <div className="flex items-center justify-end gap-1">
                                {editingCell?.id === log.id && (
                                  <button
                                    type="button"
                                    className="btn btn-ghost btn-xs btn-square"
                                    aria-label={`${formatAbsoluteDate(log.date)}の編集をキャンセル`}
                                    title="キャンセル"
                                    onMouseDown={(event) => event.preventDefault()}
                                    onClick={cancelEditing}
                                    disabled={isSaving}
                                  >
                                    <Icon icon="lucide:x" className="size-4" />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  className="btn btn-ghost btn-xs btn-square text-error"
                                  aria-label={`${formatAbsoluteDate(log.date)}の記録を削除`}
                                  title="削除"
                                  onMouseDown={(event) => event.preventDefault()}
                                  onClick={() => void handleDelete(log.id)}
                                  disabled={isDeleting || savingCellKey != null}
                                >
                                  {isDeleting ? (
                                    <span className="loading loading-spinner loading-xs" />
                                  ) : (
                                    <Icon icon="lucide:trash-2" className="size-4" />
                                  )}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="modal-action">
          <button className="btn" onClick={onClose}>
            閉じる
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={onClose}>close</button>
      </form>
    </dialog>
  );
}
