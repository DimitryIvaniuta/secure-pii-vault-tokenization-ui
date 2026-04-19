import { buildApiUrl, appConfig } from '../app/config';

export interface BasicCredentials {
  username: string;
  password: string;
}

export interface ApiErrorPayload {
  message: string;
  details?: unknown;
  status: number;
}

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(payload: ApiErrorPayload) {
    super(payload.message);
    this.name = 'ApiError';
    this.status = payload.status;
    this.details = payload.details;
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string | undefined>;
  auth?: BasicCredentials;
}

function encodeBasicAuth(credentials: BasicCredentials): string {
  return `Basic ${btoa(`${credentials.username}:${credentials.password}`)}`;
}

function createRequestController(timeoutMs: number): { controller: AbortController; cleanup: () => void } {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  return {
    controller,
    cleanup: () => window.clearTimeout(timer),
  };
}

async function parseResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json') || contentType.includes('application/problem+json')) {
    return (await response.json()) as T;
  }
  return (await response.text()) as T;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers();
  headers.set('Accept', 'application/json');
  headers.set('Cache-Control', 'no-store');
  headers.set('Pragma', 'no-cache');
  headers.set('X-Correlation-Id', crypto.randomUUID());

  if (options.auth) {
    headers.set('Authorization', encodeBasicAuth(options.auth));
  }

  Object.entries(options.headers ?? {}).forEach(([key, value]) => {
    if (value && value.trim().length > 0) {
      headers.set(key, value);
    }
  });

  let body: string | undefined;
  if (options.body !== undefined) {
    headers.set('Content-Type', 'application/json');
    body = JSON.stringify(options.body);
  }

  const { controller, cleanup } = createRequestController(appConfig.requestTimeoutMs);

  try {
    const response = await fetch(buildApiUrl(path), {
      method: options.method ?? 'GET',
      headers,
      body,
      signal: controller.signal,
      credentials: 'omit',
      cache: 'no-store',
      redirect: 'error',
      referrerPolicy: 'strict-origin-when-cross-origin',
    });

    if (!response.ok) {
      const errorBody = await parseResponse<unknown>(response).catch(() => undefined);
      const message = typeof errorBody === 'string'
        ? errorBody
        : (errorBody as { message?: string; detail?: string } | undefined)?.message
          ?? (errorBody as { message?: string; detail?: string } | undefined)?.detail
          ?? response.statusText;

      throw new ApiError({
        message: message || 'Request failed',
        details: errorBody,
        status: response.status,
      });
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return parseResponse<T>(response);
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError({
        message: 'Request timed out',
        status: 408,
      });
    }
    throw error;
  } finally {
    cleanup();
  }
}
