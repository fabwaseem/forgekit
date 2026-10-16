import { runMigrations } from "../lib/db/migrate";

runMigrations()
  .then(() => {
    console.log("Migrations applied");
    process.exit(0);
  })
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
