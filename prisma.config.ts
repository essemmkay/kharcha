import "dotenv/config";
import { defineConfig, env } from "@prisma/config";

// Prisma 7 config. The CLI (migrate/introspect) uses the DIRECT connection.
// The runtime client uses the pooled DATABASE_URL via the pg driver adapter
// (see lib/prisma.ts).
export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DIRECT_URL"),
  },
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
});
