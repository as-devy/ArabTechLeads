import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/lib/generated/prisma/client";

const SCHEMA_GEN = 9;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaPool: Pool | undefined;
  prismaGen: number | undefined;
  prismaStale: boolean | undefined;
};

function hasDelegate(client: PrismaClient, name: string) {
  const delegate = Reflect.get(client, name, client) as { findMany?: unknown } | undefined;
  return typeof delegate?.findMany === "function";
}

function getPool() {
  if (globalForPrisma.prismaPool) return globalForPrisma.prismaPool;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  const pool = new Pool({
    connectionString,
    max: process.env.NODE_ENV === "production" ? 3 : 5,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
  });
  globalForPrisma.prismaPool = pool;
  return pool;
}

export function getPrisma() {
  const cached = globalForPrisma.prisma;
  if (cached && globalForPrisma.prismaGen === SCHEMA_GEN) {
    if (hasDelegate(cached, "voiceRoom") || globalForPrisma.prismaStale) {
      return cached;
    }
  }

  const adapter = new PrismaPg(getPool());
  const client = new PrismaClient({ adapter });

  globalForPrisma.prisma = client;
  globalForPrisma.prismaGen = SCHEMA_GEN;
  globalForPrisma.prismaStale = !hasDelegate(client, "voiceRoom");
  return client;
}

/** Lazy proxy so importing this module does not require DATABASE_URL at build time. */
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrisma();
    const value = Reflect.get(client, prop, client);
    return typeof value === "function" ? value.bind(client) : value;
  },
});

export function prismaModel<T>(name: string): T | undefined {
  const client = getPrisma();
  const value = Reflect.get(client, name, client);
  return value as T | undefined;
}
