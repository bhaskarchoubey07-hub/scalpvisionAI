import { Redis } from "ioredis";
import { config } from "./config.js";

export const redis = new Redis(config.redisUrl, {
  lazyConnect: true,
  maxRetriesPerRequest: 1
});

redis.on("error", () => {
  // Redis is optional in local development; suppress noisy connection spam.
});
