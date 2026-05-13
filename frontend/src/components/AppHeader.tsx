import { Icon } from "@iconify/react";

type Props = {
  onMenuOpen: () => void;
};

export function AppHeader({ onMenuOpen }: Props) {
  return (
    <header className="navbar border-b border-base-300 bg-base-100 shadow-sm">
      <div className="flex-none">
        <button
          type="button"
          className="btn btn-square btn-ghost"
          onClick={onMenuOpen}
          aria-label="メニューを開く"
        >
          <Icon icon="lucide:menu" className="size-5" />
        </button>
      </div>
      <div className="flex-1">
        <div className="text-lg font-bold">筋トレ記録</div>
      </div>
    </header>
  );
}
