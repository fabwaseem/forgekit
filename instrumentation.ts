export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.RUN_MIGRATIONS !== "true") return;
  const { runMigrations } = await import("./lib/db/migrate");
  await runMigrations();
}
