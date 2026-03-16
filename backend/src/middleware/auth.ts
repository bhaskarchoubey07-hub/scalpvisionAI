import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config.js";

export function requireAuth(request: Request, response: Response, next: NextFunction) {
  const header = request.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return response.status(401).json({ error: "Missing bearer token" });
  }

  try {
    const token = header.slice("Bearer ".length);
    const decoded = jwt.verify(token, config.jwtSecret);
    response.locals.user = decoded;
    return next();
  } catch {
    return response.status(401).json({ error: "Invalid token" });
  }
}
