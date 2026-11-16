import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { startServer } from "../../packages/producer/src/server.ts";

function readIntegerEnv(name: string, fallback: number, min: number, max: number): number {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;

  const value = Number(raw);
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new Error(`${name} must be an integer between ${min} and ${max}`);
  }
  return value;
}

const host = process.env.PRODUCER_HOST?.trim() || "127.0.0.1";
const port = readIntegerEnv("PRODUCER_PORT", 9847, 1, 65535);
const maxConcurrentRenders = readIntegerEnv(
  "PRODUCER_MAX_CONCURRENT_RENDERS",
  1,
  1,
  16,
);

const projectsDir = resolve(process.env.PRODUCER_PROJECTS_DIR || "./api-projects");
const rendersDir = resolve(process.env.PRODUCER_RENDERS_DIR || "./api-renders");
const authToken = process.env.PRODUCER_AUTH_TOKEN?.trim() || undefined;
const allowedHosts = (process.env.PRODUCER_ALLOWED_HOSTS || "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

mkdirSync(projectsDir, { recursive: true });
mkdirSync(rendersDir, { recursive: true });

startServer({
  hostname: host,
  port,
  authToken,
  projectsDir,
  rendersDir,
  maxConcurrentRenders,
  allowedHosts,
  confineRequests: true,
  allowDebug: false,
});

console.info("[VideoFactory HyperFrames API] started", {
  baseUrl: `http://${host}:${port}`,
  projectsDir,
  rendersDir,
  maxConcurrentRenders,
  authentication: authToken ? "bearer token required" : "local-only",
});
