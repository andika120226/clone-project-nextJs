import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export type AuthRole = "ADMIN" | "CUSTOMER" | "FARMER";

export type AuthTokenPayload = {
  sub: string;
  role: AuthRole;
  email: string;
};

const DEFAULT_JWT_SECRET = "dev-infotani-secret-change-me";

function getJwtSecret() {
  return process.env.JWT_SECRET || DEFAULT_JWT_SECRET;
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function signAccessToken(payload: AuthTokenPayload) {
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: "7d",
  });
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, getJwtSecret()) as AuthTokenPayload;
}
