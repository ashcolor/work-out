import { Hono } from "hono";
import { handle } from "hono/cloudflare-pages";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";

type Bindings = {
  DB: D1Database;
};

type BodyPartRow = {
  id: number;
  name: string;
  sortOrder: number;
};

type ExerciseRow = {
  id: number;
  name: string;
  bodyPartId: number;
  tag: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// --- 認証 ---

const USERNAME = "ashcolor";
const PASSWORD = "password";

// 認証ミドルウェア。login/logout/me 以外の API を保護する
app.use("/api/*", async (c, next) => {
  const path = new URL(c.req.url).pathname;
  if (path === "/api/login" || path === "/api/logout" || path === "/api/me") {
    return next();
  }

  const token = getCookie(c, "session");
  if (!token) return c.json({ error: "Unauthorized" }, 401);

  const row = await c.env.DB.prepare("SELECT token FROM sessions WHERE token = ?")
    .bind(token)
    .first();

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

  const row = await c.env.DB.prepare("SELECT token FROM sessions WHERE token = ?")
    .bind(token)
    .first();

  if (!row) return c.json({ authenticated: false }, 401);
  return c.json({ authenticated: true, username: USERNAME });
});

// --- 部位 ---

app.get("/api/body-parts", async (c) => {
  const bodyParts = await c.env.DB.prepare(
    "SELECT id, name, sort_order AS sortOrder FROM body_parts ORDER BY sort_order, name"
  ).all<BodyPartRow>();

  return c.json(bodyParts.results);
});

// --- 種目 ---

app.get("/api/exercises", async (c) => {
  const exercises = await c.env.DB.prepare(
    `
      SELECT
        exercises.id,
        exercises.name,
        exercises.body_part_id AS bodyPartId,
        body_parts.name AS tag
      FROM exercises
      INNER JOIN body_parts ON body_parts.id = exercises.body_part_id
      ORDER BY body_parts.sort_order, exercises.name
    `
  ).all<ExerciseRow>();

  const result = await Promise.all(
    exercises.results.map(async (exercise) => {
      const logs = await c.env.DB.prepare(
        "SELECT weight, date FROM workout_logs WHERE exercise_id = ? ORDER BY date DESC LIMIT 3"
      )
        .bind(exercise.id)
        .all();

      return { ...exercise, recentLogs: logs.results };
    })
  );

  return c.json(result);
});

app.post("/api/exercises", async (c) => {
  const { name, bodyPartId } = await c.req.json<{
    name?: string;
    bodyPartId?: number;
  }>();

  const trimmedName = name?.trim();
  const normalizedBodyPartId = Number(bodyPartId);

  if (!trimmedName || !Number.isInteger(normalizedBodyPartId)) {
    return c.json({ error: "name and bodyPartId are required" }, 400);
  }

  const bodyPart = await c.env.DB.prepare(
    "SELECT id, name FROM body_parts WHERE id = ?"
  )
    .bind(normalizedBodyPartId)
    .first<{ id: number; name: string }>();

  if (!bodyPart) {
    return c.json({ error: "Invalid body part" }, 400);
  }

  const result = await c.env.DB.prepare(
    "INSERT INTO exercises (name, body_part_id) VALUES (?, ?)"
  )
    .bind(trimmedName, normalizedBodyPartId)
    .run();

  return c.json(
    {
      id: result.meta.last_row_id,
      name: trimmedName,
      bodyPartId: normalizedBodyPartId,
      tag: bodyPart.name,
    },
    201
  );
});

app.delete("/api/exercises/:id", async (c) => {
  const id = c.req.param("id");
  await c.env.DB.prepare("DELETE FROM exercises WHERE id = ?").bind(id).run();
  return c.json({ ok: true });
});

// --- 記録 ---

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
