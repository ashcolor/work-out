import { Hono } from "hono";
import { handle } from "hono/cloudflare-pages";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";

type Bindings = {
  DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

// --- 認証 ---

const USERNAME = "ashcolor";
const PASSWORD = "password";

// 認証ミドルウェア（login/logout/me以外のAPIを保護）
app.use("/api/*", async (c, next) => {
  const path = new URL(c.req.url).pathname;
  if (path === "/api/login" || path === "/api/logout" || path === "/api/me") {
    return next();
  }
  const token = getCookie(c, "session");
  if (!token) return c.json({ error: "Unauthorized" }, 401);
  const row = await c.env.DB.prepare("SELECT token FROM sessions WHERE token = ?").bind(token).first();
  if (!row) return c.json({ error: "Unauthorized" }, 401);
  return next();
});

app.post("/api/login", async (c) => {
  const { username, password } = await c.req.json();
  if (username !== USERNAME || password !== PASSWORD) {
    return c.json({ error: "Invalid credentials" }, 401);
  }
  const token = crypto.randomUUID();
  await c.env.DB.prepare("INSERT INTO sessions (token) VALUES (?)").bind(token).run();
  const isLocal = new URL(c.req.url).hostname === "localhost";
  setCookie(c, "session", token, {
    path: "/",
    httpOnly: true,
    secure: !isLocal,
    sameSite: "Lax",
    maxAge: 60 * 60 * 24 * 30,
  });
  return c.json({ ok: true });
});

app.post("/api/logout", async (c) => {
  const token = getCookie(c, "session");
  if (token) {
    await c.env.DB.prepare("DELETE FROM sessions WHERE token = ?").bind(token).run();
  }
  deleteCookie(c, "session", { path: "/" });
  return c.json({ ok: true });
});

app.get("/api/me", async (c) => {
  const token = getCookie(c, "session");
  if (!token) return c.json({ authenticated: false }, 401);
  const row = await c.env.DB.prepare("SELECT token FROM sessions WHERE token = ?").bind(token).first();
  if (!row) return c.json({ authenticated: false }, 401);
  return c.json({ authenticated: true, username: USERNAME });
});

// --- 種目 ---

app.get("/api/exercises", async (c) => {
  const exercises = await c.env.DB.prepare(
    "SELECT id, name, tag FROM exercises ORDER BY name"
  ).all();

  const result = await Promise.all(
    (exercises.results as any[]).map(async (ex) => {
      const logs = await c.env.DB.prepare(
        "SELECT weight, date FROM workout_logs WHERE exercise_id = ? ORDER BY date DESC LIMIT 3"
      )
        .bind(ex.id)
        .all();
      return { ...ex, recentLogs: logs.results };
    })
  );

  return c.json(result);
});

app.post("/api/exercises", async (c) => {
  const { name, tag } = await c.req.json();
  if (!name || !tag) return c.json({ error: "name and tag are required" }, 400);

  const result = await c.env.DB.prepare(
    "INSERT INTO exercises (name, tag) VALUES (?, ?)"
  )
    .bind(name, tag)
    .run();

  return c.json({ id: result.meta.last_row_id, name, tag }, 201);
});

app.delete("/api/exercises/:id", async (c) => {
  const id = c.req.param("id");
  await c.env.DB.prepare("DELETE FROM exercises WHERE id = ?").bind(id).run();
  return c.json({ ok: true });
});

// --- ログ ---

app.get("/api/logs/:exerciseId", async (c) => {
  const exerciseId = c.req.param("exerciseId");
  const logs = await c.env.DB.prepare(
    "SELECT id, weight, reps, date FROM workout_logs WHERE exercise_id = ? ORDER BY date DESC"
  )
    .bind(exerciseId)
    .all();

  return c.json(logs.results);
});

app.post("/api/logs/:exerciseId", async (c) => {
  const exerciseId = c.req.param("exerciseId");
  const { weight, reps, date } = await c.req.json();
  if (!date) return c.json({ error: "date is required" }, 400);

  const result = await c.env.DB.prepare(
    "INSERT INTO workout_logs (exercise_id, weight, reps, date) VALUES (?, ?, ?, ?)"
  )
    .bind(exerciseId, weight ?? null, reps ?? null, date)
    .run();

  return c.json({ id: result.meta.last_row_id }, 201);
});

app.delete("/api/logs/entry/:id", async (c) => {
  const id = c.req.param("id");
  await c.env.DB.prepare("DELETE FROM workout_logs WHERE id = ?").bind(id).run();
  return c.json({ ok: true });
});

export const onRequest = handle(app);
