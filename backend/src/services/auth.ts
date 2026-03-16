import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../db.js";
import { config } from "../config.js";

type AuthUser = {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
};

export async function createUser(email: string, password: string, fullName: string) {
  const existing = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
  if (existing.rowCount) {
    throw new Error("An account with this email already exists");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const { rows } = await pool.query<AuthUser>(
    `INSERT INTO users (email, password_hash, full_name, email_verified)
     VALUES ($1, $2, $3, $4)
     RETURNING id, email, full_name, avatar_url`,
    [email, passwordHash, fullName, true]
  );

  return rows[0];
}

export async function verifyUser(email: string, password: string) {
  const { rows } = await pool.query<
    AuthUser & {
      password_hash: string | null;
    }
  >("SELECT id, email, full_name, avatar_url, password_hash FROM users WHERE email = $1", [email]);

  const user = rows[0];
  if (!user?.password_hash) {
    throw new Error("Invalid email or password");
  }

  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) {
    throw new Error("Invalid email or password");
  }

  return {
    id: user.id,
    email: user.email,
    full_name: user.full_name,
    avatar_url: user.avatar_url
  };
}

export function createAuthToken(user: AuthUser) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      fullName: user.full_name
    },
    config.jwtSecret,
    { expiresIn: "7d" }
  );
}
