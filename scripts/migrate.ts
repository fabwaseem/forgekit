import { existsSync } from "node:fs";

// Load .env so `pnpm db:migrate` uses the same DATABASE_URL as the app.
// Variables already set in the environment win.
if (existsSync(".env")) process.loadEnvFile(".env");

import("../lib/db/migrate")
  .then(({ runMigrations }) => runMigrations())
  .then(() => {
    console.log("Migrations applied");
    process.exit(0);
  })
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
