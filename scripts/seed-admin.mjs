/**
 * Create or promote the first ADMIN user.
 *
 *   ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='…' node scripts/seed-admin.mjs
 *
 * Re-running updates the existing user's password and role, so it is safe to use
 * for a password reset too.
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;
const name = process.env.ADMIN_NAME ?? null;

if (!email || !password) {
  console.error("Set ADMIN_EMAIL and ADMIN_PASSWORD.");
  process.exit(1);
}

if (password.length < 8) {
  console.error("ADMIN_PASSWORD must be at least 8 characters.");
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

try {
  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash, role: "ADMIN" },
    create: { email, passwordHash, name, role: "ADMIN" },
  });

  console.log(`ADMIN ready: ${user.email} (${user.id})`);
} catch (error) {
  console.error("Failed to seed admin:", error);
  process.exit(1);
} finally {
  await prisma.$disconnect();
  await pool.end();
}
