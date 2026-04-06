import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: Number(process.env.PORT ?? process.env.API_PORT ?? 4000),
  frontendUrl: process.env.FRONTEND_URL ?? "http://localhost:3000",
  jwtSecret: process.env.JWT_SECRET ?? "change-me",
  databaseUrl: process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/scalpvision",
  // Leave empty by default so local/dev doesn’t spam connection errors.
  redisUrl: process.env.REDIS_URL ?? "",
  aiServiceUrl: process.env.AI_SERVICE_URL ?? "http://localhost:8000",
  cloudStorageBucket: process.env.CLOUD_STORAGE_BUCKET ?? "scalpvision-screenshots",
  twelveDataApiKey: process.env.TWELVE_DATA_API_KEY ?? "",
  allowedOrigins: (process.env.ALLOWED_ORIGINS ?? "").split(",").map((s) => s.trim()).filter(Boolean)
};
