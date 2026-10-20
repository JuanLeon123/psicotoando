import { PublicUser } from './auth.models';

const DEFAULT_RETURN_URL = '/mi-cuenta';
export const ADMIN_HOME_URL = '/admin';

/** Accepts only internal paths, so a crafted link cannot redirect off-site. */
export function safeReturnUrl(value: string | null | undefined): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return DEFAULT_RETURN_URL;
  }
  if (value.includes('\\')) return DEFAULT_RETURN_URL;
  return value;
}

/** The admin always lands in the panel; customers go back to where they were. */
export function postLoginUrl(
  user: PublicUser,
  returnUrl: string | null | undefined,
): string {
  if (user.role === 'admin') {
    return returnUrl?.startsWith(ADMIN_HOME_URL) ? safeReturnUrl(returnUrl) : ADMIN_HOME_URL;
  }
  return safeReturnUrl(returnUrl);
}
