import express, {
  type Express,
  type Request,
  type Response,
  type RequestHandler,
  type ErrorRequestHandler,
} from "express";
import { pool } from "./db.js";

// Express 4 does not forward errors thrown in async handlers to the error
// middleware, so wrap them and pass rejections to `next`.
const wrap =
  (fn: RequestHandler): RequestHandler =>
  (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);

export function createApp(): Express {
  const app = express();
  app.use(express.json());

  // Liveness: the process is up. No DB dependency (used by CI and basic checks).
  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({ status: "ok" });
  });

  // Readiness: the DB is reachable. Used as the deploy health gate.
  app.get(
    "/api/health/ready",
    wrap(async (_req, res) => {
      await pool.query("SELECT 1");
      res.json({ status: "ready" });
    }),
  );

  app.get(
    "/api/todos",
    wrap(async (_req, res) => {
      const { rows } = await pool.query(
        "SELECT id, title, completed, created_at FROM todos ORDER BY id DESC",
      );
      res.json(rows);
    }),
  );

  app.post(
    "/api/todos",
    wrap(async (req, res) => {
      const title = String(req.body?.title ?? "").trim();
      if (!title) {
        res.status(400).json({ error: "title is required" });
        return;
      }
      const { rows } = await pool.query(
        "INSERT INTO todos (title) VALUES ($1) RETURNING id, title, completed, created_at",
        [title],
      );
      res.status(201).json(rows[0]);
    }),
  );

  app.patch(
    "/api/todos/:id",
    wrap(async (req, res) => {
      const id = Number(req.params.id);
      if (!Number.isInteger(id)) {
        res.status(400).json({ error: "invalid id" });
        return;
      }
      const completed =
        typeof req.body?.completed === "boolean" ? req.body.completed : null;
      const nextTitle =
        typeof req.body?.title === "string" && req.body.title.trim()
          ? req.body.title.trim()
          : null;
      const { rows } = await pool.query(
        "UPDATE todos SET completed = COALESCE($1, completed), title = COALESCE($2, title) WHERE id = $3 RETURNING id, title, completed, created_at",
        [completed, nextTitle, id],
      );
      if (rows.length === 0) {
        res.status(404).json({ error: "not found" });
        return;
      }
      res.json(rows[0]);
    }),
  );

  app.delete(
    "/api/todos/:id",
    wrap(async (req, res) => {
      const id = Number(req.params.id);
      if (!Number.isInteger(id)) {
        res.status(400).json({ error: "invalid id" });
        return;
      }
      const { rowCount } = await pool.query("DELETE FROM todos WHERE id = $1", [
        id,
      ]);
      res.status(rowCount ? 204 : 404).end();
    }),
  );

  const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ error: "internal server error" });
  };
  app.use(errorHandler);

  return app;
}
