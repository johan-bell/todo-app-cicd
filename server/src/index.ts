import { createApp } from "./app.js";
import { runMigrations, pool } from "./db.js";

const PORT = Number(process.env.PORT ?? 4000);

async function main(): Promise<void> {
  await runMigrations();

  const app = createApp();
  const server = app.listen(PORT, () => {
    console.log(`API listening on :${PORT}`);
  });

  const shutdown = () => {
    server.close(() => {
      void pool.end().then(() => process.exit(0));
    });
  };
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

main().catch((err) => {
  console.error("Fatal startup error", err);
  process.exit(1);
});
