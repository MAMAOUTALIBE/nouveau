export const LAST_HEALTHY_ROUTE_KEY = 'rh_last_healthy_route';

const EXCLUDED_ROUTE_PREFIXES = [
  '/service-indisponible',
  '/erreur-serveur',
  '/not-found',
  '/auth/login',
  '/auth',
  '/acces-refuse',
];

export function writeLastHealthyRoute(route: string): void {
  const normalized = normalizeRoute(route);
  if (!isHealthyRoute(normalized)) {
    return;
  }

  try {
    localStorage.setItem(LAST_HEALTHY_ROUTE_KEY, normalized);
  } catch {
    // Ignore storage failures (private mode, quota).
  }
}

export function readLastHealthyRoute(): string | null {
  try {
    const raw = localStorage.getItem(LAST_HEALTHY_ROUTE_KEY);
    const normalized = normalizeRoute(raw || '');
    if (!isHealthyRoute(normalized)) {
      return null;
    }
    return normalized;
  } catch {
    return null;
  }
}

export function resolveRecoveryReturnUrl(currentUrl: string, targetRoute: string): string {
  const normalizedCurrent = normalizeRoute(currentUrl);
  if (
    normalizedCurrent &&
    isHealthyRoute(normalizedCurrent) &&
    !normalizedCurrent.startsWith(targetRoute)
  ) {
    return normalizedCurrent;
  }

  const lastHealthy = readLastHealthyRoute();
  if (lastHealthy) {
    return lastHealthy;
  }

  return '/dashboard';
}

function isHealthyRoute(route: string): boolean {
  if (!route.startsWith('/')) {
    return false;
  }

  return !EXCLUDED_ROUTE_PREFIXES.some((prefix) => route.startsWith(prefix));
}

function normalizeRoute(route: string): string {
  return String(route || '').trim();
}
