import { useEffect, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { deleteLog, fetchLogs } from "../api";
import type { Exercise, WorkoutLog } from "../types";
import { TagBadge } from "./TagBadge";
import { formatWeight } from "../utils/formatWeight";

type Props = {
  exercise: Exercise;
  onClose: () => void;
};

type LogEntry = WorkoutLog & { id: number };

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
          <LineChart
            data={chartData}
            margin={{ top: 8, right: 8, left: 4, bottom: 0 }}
          >
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

export function HistoryModal({ exercise, onClose }: Props) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const maxWeight = logs.reduce<number | null>((currentMax, log) => {
    if (log.weight == null) return currentMax;
    if (currentMax == null) return log.weight;
    return Math.max(currentMax, log.weight);
  }, null);

  const load = async () => {
    const data = await fetchLogs(exercise.id);
    setLogs(data);
  };

  useEffect(() => {
    load();
  }, [exercise.id]);

  const handleDelete = async (id: number) => {
    if (!confirm("この記録を削除しますか？")) return;
    await deleteLog(id);
    load();
  };

  return (
    <dialog className="modal modal-open">
      <div className="modal-box flex h-[calc(100dvh-2rem)] max-h-[calc(100dvh-2rem)] max-w-2xl flex-col overflow-hidden">
        <div className="mb-4 flex items-center gap-2">
          <h3 className="text-lg font-bold">{exercise.name}</h3>
          <TagBadge tag={exercise.tag} />
        </div>

        <div className="min-h-0 flex-1">
          {logs.length === 0 ? (
            <p className="text-base-content/50">記録がありません</p>
          ) : (
            <div className="flex h-full min-h-0 flex-col gap-4">
              <WeightChart logs={logs} />

              <div className="min-h-0 flex-1 overflow-hidden rounded-2xl border border-base-300">
                <div className="h-full overflow-y-auto">
                  <table className="table table-sm table-pin-rows">
                    <thead>
                      <tr>
                        <th>日付</th>
                        <th>重量</th>
                        <th>回数</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((log) => (
                        <tr key={log.id}>
                          <td>{formatAbsoluteDate(log.date)}</td>
                          <td
                            className={
                              log.weight != null && log.weight === maxWeight ? "font-bold" : undefined
                            }
                          >
                            {formatWeight(log.weight)}
                          </td>
                          <td>{log.reps != null ? `${log.reps}回` : "-"}</td>
                          <td>
                            <button
                              type="button"
                              className="btn btn-ghost btn-xs btn-square text-error"
                              aria-label={`${formatAbsoluteDate(log.date)}の記録を削除`}
                              title="削除"
                              onClick={() => handleDelete(log.id)}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                className="h-4 w-4"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M3 6h18"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M8 6V4h8v2"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M19 6l-1 14H6L5 6"
                                />
                                <path strokeLinecap="round" d="M10 11v6M14 11v6" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      ))}
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
