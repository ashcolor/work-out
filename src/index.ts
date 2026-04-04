import { Hono } from "hono";
import { cors } from "hono/cors";
import { exercisesRoute } from "./routes/exercises";
import { logsRoute } from "./routes/logs";

type Bindings = {
  DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use("/*", cors());

app.route("/api/exercises", exercisesRoute);
app.route("/api/logs", logsRoute);

export default app;
