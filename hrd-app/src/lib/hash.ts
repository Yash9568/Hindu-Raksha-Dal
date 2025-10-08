import { randomBytes, scrypt as _scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(_scrypt) as (password: string | Buffer, salt: string | Buffer, keylen: number) => Promise<Buffer>;

// Returns format: scrypt$N$salt$hash (N not used but reserved)
export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = await scrypt(password, salt, 64);
  return `scrypt$1$${salt}$${derivedKey.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string) {
  const parts = stored.split("$");
  if (parts.length !== 4 || parts[0] !== "scrypt") return false;
  const salt = parts[2];
  const hashHex = parts[3];
  const derivedKey = await scrypt(password, salt, 64);
  const a = Buffer.from(hashHex, "hex");
  const b = Buffer.from(derivedKey);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
