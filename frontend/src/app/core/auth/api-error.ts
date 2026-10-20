import { HttpErrorResponse } from '@angular/common/http';

const NETWORK_ERROR =
  'No pudimos conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.';
const TOO_MANY_REQUESTS =
  'Demasiados intentos. Espera un momento e inténtalo de nuevo.';
const GENERIC_ERROR =
  'Algo salió mal. Inténtalo de nuevo en unos minutos.';

/** Turns an API error into a message that can be shown to the user. */
export function describeApiError(error: unknown, fallback = GENERIC_ERROR): string {
  if (!(error instanceof HttpErrorResponse)) return fallback;
  if (error.status === 0) return NETWORK_ERROR;
  if (error.status === 429) return TOO_MANY_REQUESTS;
  if (error.status >= 500) return fallback;
  const message: unknown = error.error?.message;
  if (Array.isArray(message) && message.length) return message.join(' ');
  if (typeof message === 'string' && message.trim()) return message;
  return fallback;
}
