import { Hono } from "hono";

type Bindings = { DB: D1Database };

export const exercisesRoute = new Hono<{ Bindings: Bindings }>();

// 種目一覧（直近3件の履歴付き）
exercisesRoute.get("/", async (c) => {
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

// 種目追加
exercisesRoute.post("/", async (c) => {
  const { name, tag } = await c.req.json();
  if (!name || !tag) return c.json({ error: "name and tag are required" }, 400);

  const result = await c.env.DB.prepare(
    "INSERT INTO exercises (name, tag) VALUES (?, ?)"
  )
    .bind(name, tag)
    .run();

  return c.json({ id: result.meta.last_row_id, name, tag }, 201);
});

// 種目削除
exercisesRoute.delete("/:id", async (c) => {
  const id = c.req.param("id");
  await c.env.DB.prepare("DELETE FROM exercises WHERE id = ?").bind(id).run();
  return c.json({ ok: true });
});
