import mysql from "mysql2/promise";

const requiredEnv = [
  "DB_HOST",
  "DB_PORT",
  "DB_USER",
  "DB_PASSWORD",
  "DB_NAME",
] as const;

const globalForDb = globalThis as unknown as {
  mysqlPool?: mysql.Pool;
};

function assertEnv() {
  for (const key of requiredEnv) {
    if (!process.env[key]) {
      throw new Error(`Missing environment variable: ${key}`);
    }
  }
}

export function getDbPool() {
  if (globalForDb.mysqlPool) {
    return globalForDb.mysqlPool;
  }

  assertEnv();

  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  if (process.env.NODE_ENV !== "production") {
    globalForDb.mysqlPool = pool;
  }

  return pool;
}
