import "dotenv/config";
import { randomBytes } from "node:crypto";
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32).optional(),
  FRONTEND_URL: z.string().url().default("http://localhost:5173"),
  PORT: z.coerce.number().int().positive().default(8080),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  TRUST_PROXY_HOPS: z.coerce.number().int().nonnegative().default(0),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error("Invalid environment configuration", parsed.error.flatten().fieldErrors);
  process.exit(1);
}
if (parsed.data.NODE_ENV === "production" && !parsed.data.JWT_SECRET) {
  console.error("Invalid environment configuration: JWT_SECRET is required in production.");
  process.exit(1);
}
export const env = { ...parsed.data, JWT_SECRET: parsed.data.JWT_SECRET ?? randomBytes(32).toString("hex") };
