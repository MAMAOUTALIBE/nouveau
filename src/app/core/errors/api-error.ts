import { HttpErrorResponse } from '@angular/common/http';

type ErrorPayload = Record<string, unknown>;

export type ApiErrorCode =
  | 'NETWORK_UNREACHABLE'
  | 'TIMEOUT'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'VALIDATION'
  | 'SERVER'
  | 'UNKNOWN';

export interface NormalizedApiError {
  code: ApiErrorCode;
  status: number;
  message: string;
  userMessage: string;
  requestId?: string;
  violations: string[];
}

export function normalizeHttpError(error: unknown): NormalizedApiError {
  if (!(error instanceof HttpErrorResponse)) {
    return {
      code: 'UNKNOWN',
      status: 0,
      message: toMessage(error),
      userMessage: 'Erreur inattendue.',
      violations: [],
    };
  }

  const payload = toErrorPayload(error.error);
  const status = error.status ?? 0;
  const code = resolveCode(status, payload, error.statusText);
  const violations = extractViolations(payload);
  const message = extractMessage(error.error, payload) || defaultMessageFor(code, status);
  const requestId = extractRequestId(payload);

  return {
    code,
    status,
    message,
    userMessage: toUserMessage(code, status, message, violations),
    requestId,
    violations,
  };
}

function resolveCode(status: number, payload: ErrorPayload | null, statusText: string): ApiErrorCode {
  const payloadCode = readStringField(payload, ['code', 'errorCode', 'error_code'])?.toUpperCase();
  if (payloadCode === 'TIMEOUT') return 'TIMEOUT';

  if (status === 0) {
    if (statusText.toLowerCase().includes('timeout')) return 'TIMEOUT';
    return 'NETWORK_UNREACHABLE';
  }
  if (status === 401) return 'UNAUTHORIZED';
  if (status === 403) return 'FORBIDDEN';
  if (status === 404) return 'NOT_FOUND';
  if (status === 409) return 'CONFLICT';
  if (status === 422 || status === 400) return 'VALIDATION';
  if (status >= 500) return 'SERVER';
  return 'UNKNOWN';
}

function defaultMessageFor(code: ApiErrorCode, status: number): string {
  switch (code) {
    case 'NETWORK_UNREACHABLE':
      return 'API indisponible. Verifiez la connexion au backend.';
    case 'TIMEOUT':
      return 'Le backend ne repond pas dans les delais attendus.';
    case 'UNAUTHORIZED':
      return 'Session invalide ou expiree.';
    case 'FORBIDDEN':
      return 'Acces refuse.';
    case 'NOT_FOUND':
      return 'Ressource introuvable.';
    case 'CONFLICT':
      return 'Conflit detecte.';
    case 'VALIDATION':
      return 'Donnees invalides.';
    case 'SERVER':
      return 'Erreur serveur.';
    case 'UNKNOWN':
    default:
      return `Erreur API (${status})`;
  }
}

function toUserMessage(
  code: ApiErrorCode,
  status: number,
  message: string,
  violations: string[]
): string {
  if (code === 'VALIDATION' && violations.length > 0) {
    return violations[0];
  }

  if (code === 'UNKNOWN' && status > 0) {
    return `Erreur API (${status})`;
  }

  if (message.trim().length > 0) {
    return message;
  }

  return defaultMessageFor(code, status);
}

function extractMessage(rawError: unknown, payload: ErrorPayload | null): string | null {
  if (typeof rawError === 'string' && rawError.trim().length > 0) {
    return rawError;
  }

  const payloadMessage = readStringField(payload, [
    'message',
    'detail',
    'title',
    'error',
    'errorDescription',
    'error_description',
  ]);
  if (payloadMessage) {
    return payloadMessage;
  }

  const firstViolation = extractViolations(payload)[0];
  if (firstViolation) {
    return firstViolation;
  }

  return null;
}

function extractViolations(payload: ErrorPayload | null): string[] {
  if (!payload) {
    return [];
  }

  const errors = payload['errors'];
  if (!Array.isArray(errors)) {
    return [];
  }

  return errors
    .map((entry) => {
      if (typeof entry === 'string') return entry.trim();
      if (typeof entry === 'object' && entry !== null) {
        return readStringField(entry as ErrorPayload, ['message', 'detail']) || '';
      }
      return '';
    })
    .filter((entry) => entry.length > 0);
}

function extractRequestId(payload: ErrorPayload | null): string | undefined {
  return readStringField(payload, ['requestId', 'request_id', 'traceId', 'trace_id']);
}

function readStringField(source: ErrorPayload | null, keys: string[]): string | undefined {
  if (!source) return undefined;
  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
  }
  return undefined;
}

function toErrorPayload(value: unknown): ErrorPayload | null {
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return value as ErrorPayload;
  }
  return null;
}

function toMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }
  return 'Erreur inconnue';
}
