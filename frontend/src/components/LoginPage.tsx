import { useState } from "react";
import { login } from "../api";

export function LoginPage({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(false);
    const ok = await login(username, password);
    setLoading(false);
    if (ok) {
      onLogin();
    } else {
      setError(true);
    }
  };

  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center">
      <form onSubmit={handleSubmit} className="card bg-base-100 shadow-xl p-8 w-80">
        <h2 className="text-2xl font-bold text-center mb-6">ログイン</h2>
        {error && (
          <div className="alert alert-error mb-4 text-sm">
            ユーザー名またはパスワードが違います
          </div>
        )}
        <input
          type="text"
          placeholder="ユーザー名"
          className="input input-bordered w-full mb-3"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoFocus
        />
        <input
          type="password"
          placeholder="パスワード"
          className="input input-bordered w-full mb-4"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit" className="btn btn-primary w-full" disabled={loading}>
          {loading ? "ログイン中..." : "ログイン"}
        </button>
      </form>
    </div>
  );
}
