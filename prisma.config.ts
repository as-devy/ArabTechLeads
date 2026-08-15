import "dotenv/config";
import { defineConfig } from "prisma/config";

const datasourceUrl =
  process.env.DIRECT_URL ||
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@localhost:5432/postgres";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Direct/session URL for Prisma Migrate; runtime app uses DATABASE_URL via adapter.
    url: datasourceUrl,
  },
});
