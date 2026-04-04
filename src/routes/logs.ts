import { Hono } from "hono";

type Bindings = { DB: D1Database };

export const logsRoute = new Hono<{ Bindings: Bindings }>();

// 特定種目のログ一覧
logsRoute.get("/:exerciseId", async (c) => {
  const exerciseId = c.req.param("exerciseId");
  const logs = await c.env.DB.prepare(
    "SELECT id, weight, reps, date FROM workout_logs WHERE exercise_id = ? ORDER BY date DESC"
  )
    .bind(exerciseId)
    .all();

  return c.json(logs.results);
});

// ログ追加
logsRoute.post("/:exerciseId", async (c) => {
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

// ログ削除
logsRoute.delete("/entry/:id", async (c) => {
  const id = c.req.param("id");
  await c.env.DB.prepare("DELETE FROM workout_logs WHERE id = ?").bind(id).run();
  return c.json({ ok: true });
});
