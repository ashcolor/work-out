import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { usePwaInstallPrompt } from "../utils/usePwaInstallPrompt";

type Props = {
  open: boolean;
  exerciseCount: number;
  onClose: () => void;
  onOpenExercises: () => void;
  onLogout: () => void;
};

function SidebarIcon({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-base-200 text-base-content">
      {children}
    </span>
  );
}

function isIosBrowser() {
  const ua = navigator.userAgent;
  const isIosDevice = /iPhone|iPad|iPod/i.test(ua);
  const isIpadOsDesktopMode = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;

  return isIosDevice || isIpadOsDesktopMode;
}

export function AppSidebar({
  open,
  exerciseCount,
  onClose,
  onOpenExercises,
  onLogout,
}: Props) {
  const [showIosGuide, setShowIosGuide] = useState(false);
  const isIos = isIosBrowser();
  const { canInstall, isInstalled, promptInstall } = usePwaInstallPrompt();
  const showInstallAction = !isInstalled && (canInstall || isIos);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  const handleInstall = async () => {
    if (!canInstall) {
      if (isIos) {
        setShowIosGuide(true);
      }
      return;
    }

    await promptInstall();
    onClose();
  };

  return (
    <>
      {open ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/30"
          onClick={onClose}
          aria-label="メニューを閉じる"
        />
      ) : null}

      <aside
        className={`fixed left-0 top-0 z-50 flex h-full w-72 flex-col border-r border-base-300 bg-base-100 shadow-xl transition-transform duration-200 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-hidden={!open}
      >
        <div className="flex items-center gap-3 border-b border-base-300 px-4 py-4">
          <div className="flex h-11 w-11 items-center justify-center">
            <img src="/workout-icon.svg" alt="" className="h-9 w-9 rounded-2xl" />
          </div>
          <div>
            <div className="text-lg font-bold">筋トレ</div>
            <div className="text-xs text-base-content/50">ワークアウト記録</div>
          </div>
          <button
            type="button"
            className="btn btn-square btn-ghost btn-sm ml-auto"
            onClick={onClose}
            aria-label="閉じる"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-4 w-4"
            >
              <path strokeLinecap="round" d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>

        <div className="px-3 py-4">
          <div className="mb-2 px-3 text-xs font-semibold uppercase tracking-[0.2em] text-base-content/40">
            Menu
          </div>
          <ul className="menu w-full gap-1 rounded-box p-0">
            <li>
              <button
                type="button"
                className="flex items-center gap-3 rounded-2xl px-3 py-3 text-left"
                onClick={onOpenExercises}
              >
                <SidebarIcon>
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
                      d="M12 5v14M5 12h14"
                    />
                  </svg>
                </SidebarIcon>
                <div className="flex flex-1 items-center justify-between gap-3">
                  <div>
                    <div className="font-medium">種目追加</div>
                    <div className="text-xs text-base-content/50">一覧へ追加して管理</div>
                  </div>
                  <div className="badge badge-outline">{exerciseCount}</div>
                </div>
              </button>
            </li>
          </ul>
        </div>

        <div className="mt-auto space-y-3 border-t border-base-300 p-4">
          {showInstallAction ? (
            <button type="button" className="btn btn-primary w-full" onClick={handleInstall}>
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
                  d="M12 3v12m0 0 4-4m-4 4-4-4M5 21h14"
                />
              </svg>
              {canInstall ? "アプリをインストール" : "ホーム画面に追加"}
            </button>
          ) : null}

          <button type="button" className="btn btn-ghost w-full justify-start" onClick={onLogout}>
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
                d="M15 16l4-4m0 0-4-4m4 4H9m6 7H7a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h8"
              />
            </svg>
            ログアウト
          </button>
        </div>
      </aside>

      <dialog className={`modal ${showIosGuide ? "modal-open" : ""}`}>
        <div className="modal-box">
          <h3 className="text-lg font-bold">iPhoneでの追加方法</h3>
          <div className="mt-3 space-y-2 text-sm leading-6">
            <p>Safari の共有メニューからホーム画面に追加できます。</p>
            <p>1. 画面下の共有ボタンを押す</p>
            <p>2. 「ホーム画面に追加」を選ぶ</p>
            <p>3. 名前を確認して追加する</p>
          </div>
          <div className="modal-action">
            <button type="button" className="btn" onClick={() => setShowIosGuide(false)}>
              閉じる
            </button>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button type="button" onClick={() => setShowIosGuide(false)}>
            close
          </button>
        </form>
      </dialog>
    </>
  );
}
