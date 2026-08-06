/**
 * Ensure a local AUTH_SECRET exists for development.
 *
 * Writes into `.env.local` (gitignored, higher precedence than `.env`) so the
 * same value is shared by `proxy.ts` and `auth.ts` across restarts. An empty
 * `AUTH_SECRET=` in `.env` is treated as unset.
 */
import { randomBytes } from "node:crypto";
import { appendFileSync, existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function hasNonEmptySecret(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function envLocalHasSecret(filePath) {
  if (!existsSync(filePath)) return false;

  const contents = readFileSync(filePath, "utf8");
  for (const line of contents.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const match = trimmed.match(/^AUTH_SECRET\s*=\s*(.*)$/);
    if (!match) continue;

    let value = match[1].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    return hasNonEmptySecret(value);
  }

  return false;
}

if (hasNonEmptySecret(process.env.AUTH_SECRET)) {
  process.exit(0);
}

const envLocalPath = resolve(process.cwd(), ".env.local");

if (envLocalHasSecret(envLocalPath)) {
  process.exit(0);
}

const secret = randomBytes(32).toString("base64");
const prefix = existsSync(envLocalPath) ? "\n" : "";
appendFileSync(
  envLocalPath,
  `${prefix}AUTH_SECRET="${secret}"\n`,
  "utf8"
);

console.log(
  "Generated AUTH_SECRET in .env.local for local development."
);
