import { Icon } from "@iconify/react";
import { useRef, useState } from "react";
import { loadData, replaceData, type AppData } from "../storage";

type Props = {
  onClose: () => void;
  onImported: () => void;
};

function formatTimestamp(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}${month}${day}-${hours}${minutes}`;
}

function isValidAppData(value: unknown): value is AppData {
  if (!value || typeof value !== "object") return false;
  const data = value as Partial<AppData>;
  return (
    Array.isArray(data.bodyParts) &&
    Array.isArray(data.exercises) &&
    Array.isArray(data.logs)
  );
}

export function DataManagementModal({ onClose, onImported }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleExport = () => {
    const data = loadData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `workout-backup-${formatTimestamp(new Date())}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setMessage({ type: "success", text: "エクスポートしました" });
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!isValidAppData(parsed)) {
        setMessage({ type: "error", text: "ファイルの形式が正しくありません" });
        return;
      }

      if (!confirm("現在のデータを上書きします。よろしいですか？")) return;

      replaceData(parsed);
      setMessage({ type: "success", text: "インポートしました" });
      onImported();
    } catch {
      setMessage({ type: "error", text: "ファイルの読み込みに失敗しました" });
    }
  };

  return (
    <dialog className="modal modal-open">
      <div className="modal-box max-w-md">
        <h3 className="mb-4 text-lg font-bold">データ管理</h3>

        <div className="flex flex-col gap-3">
          <button type="button" className="btn btn-primary" onClick={handleExport}>
            <Icon icon="lucide:download" className="size-4" />
            エクスポート（JSON）
          </button>

          <button type="button" className="btn btn-outline" onClick={handleImportClick}>
            <Icon icon="lucide:upload" className="size-4" />
            インポート（JSON）
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={handleFileChange}
          />

          {message && (
            <div className={`alert text-sm ${message.type === "success" ? "alert-success" : "alert-error"}`}>
              {message.text}
            </div>
          )}

          <p className="text-xs text-base-content/55">
            データはブラウザのlocalStorageに保存されます。端末を変えるときはエクスポート/インポートを使ってください。
          </p>
        </div>

        <div className="modal-action">
          <button type="button" className="btn" onClick={onClose}>
            閉じる
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button type="button" onClick={onClose}>close</button>
      </form>
    </dialog>
  );
}
