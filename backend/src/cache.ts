import { Redis } from "ioredis";
import { config } from "./config.js";

export const redis = config.redisUrl
  ? new Redis(config.redisUrl, {
      lazyConnect: true,
      maxRetriesPerRequest: 1
    })
  : null;

// Redis is optional; silence background connection noise.
redis?.on("error", () => {});
