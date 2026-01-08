import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Load .env.local first, then .env as fallback
config({ path: ".env.local" });
config({ path: ".env" });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  engine: "classic",
  datasource: {
    // Use DIRECT_URL (session pooler) for migrations
    url: process.env.DIRECT_URL || process.env.DATABASE_URL,
  },
});
