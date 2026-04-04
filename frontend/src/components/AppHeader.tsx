type Props = {
  onMenuOpen: () => void;
  onOpenExercises: () => void;
};

export function AppHeader({ onMenuOpen, onOpenExercises }: Props) {
  return (
    <header className="navbar border-b border-base-300 bg-base-100 shadow-sm">
      <div className="flex-none">
        <button
          type="button"
          className="btn btn-square btn-ghost"
          onClick={onMenuOpen}
          aria-label="メニュー"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-5 w-5"
          >
            <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
      </div>
      <div className="flex-1">
        <div className="text-lg font-bold">筋トレ</div>
      </div>
      <div className="flex-none">
        <button
          type="button"
          className="btn btn-primary btn-sm hidden sm:inline-flex"
          onClick={onOpenExercises}
        >
          種目
        </button>
      </div>
    </header>
  );
}
