import { Hono } from "hono";
import { handle } from "hono/cloudflare-pages";

type Bindings = {
  DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

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
