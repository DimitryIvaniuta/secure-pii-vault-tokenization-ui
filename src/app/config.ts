import { z } from 'zod';

/**
 * Validates all browser-visible configuration once at startup.
 * This keeps invalid environment values from silently weakening timeouts
 * or session protection in production.
 */
const configSchema = z.object({
  VITE_API_BASE_URL: z.string().trim().optional().default(''),
  VITE_REQUEST_TIMEOUT_MS: z.coerce.number().int().min(1_000).max(120_000).default(15_000),
  VITE_SESSION_IDLE_TIMEOUT_MS: z.coerce.number().int().min(60_000).max(12 * 60 * 60 * 1_000).default(15 * 60 * 1_000),
  VITE_SESSION_WARNING_MS: z.coerce.number().int().min(10_000).max(30 * 60 * 1_000).default(60_000),
  VITE_PII_REVEAL_WINDOW_MS: z.coerce.number().int().min(5_000).max(120_000).default(30_000),
});

const parsed = configSchema.safeParse(import.meta.env);

if (!parsed.success) {
  const message = parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ');
  throw new Error(`Invalid frontend configuration: ${message}`);
}

const env = parsed.data;
const warningMs = Math.min(env.VITE_SESSION_WARNING_MS, env.VITE_SESSION_IDLE_TIMEOUT_MS - 5_000);

export const appConfig = {
  apiBaseUrl: env.VITE_API_BASE_URL.replace(/\/$/, ''),
  requestTimeoutMs: env.VITE_REQUEST_TIMEOUT_MS,
  sessionIdleTimeoutMs: env.VITE_SESSION_IDLE_TIMEOUT_MS,
  sessionWarningMs: warningMs,
  piiRevealWindowMs: env.VITE_PII_REVEAL_WINDOW_MS,
} as const;

export function buildApiUrl(path: string): string {
  if (!appConfig.apiBaseUrl) {
    return path;
  }
  return `${appConfig.apiBaseUrl}${path}`;
}
