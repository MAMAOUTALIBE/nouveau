import { Page } from 'playwright/test';

export async function primeRecruitmentAdminSession(page: Page): Promise<void> {
  await page.goto('/auth/login');
  const session = await page.evaluate(async () => {
    const response = await window.fetch('/api/v1/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'spruko@admin.com',
        password: 'sprukoadmin',
      }),
    });

    if (!response.ok) {
      throw new Error(`E2E auth bootstrap failed with status ${response.status}`);
    }

    return response.json() as Promise<{
      accessToken?: string;
      token?: string;
      refreshToken?: string;
      username?: string;
      roles?: string[];
      permissions?: string[];
      scopes?: string[];
      expiresIn?: number | string;
      refreshExpiresIn?: number | string;
    }>;
  });

  const now = Date.now();
  const accessExpiresInSeconds = Number(session.expiresIn || 1800);
  const refreshExpiresInSeconds = Number(session.refreshExpiresIn || 86400);

  await page.evaluate(({ authSession, accessTokenExpiresAt, refreshTokenExpiresAt }) => {
    const token = authSession.accessToken || authSession.token || '';
    if (!token) {
      throw new Error('E2E auth bootstrap returned no access token');
    }

    window.localStorage.setItem('rh_token', token);
    window.localStorage.setItem('rh_refresh_token', authSession.refreshToken || '');
    window.localStorage.setItem('rh_username', authSession.username || 'spruko@admin.com');
    window.localStorage.setItem('rh_token_expires_at', String(accessTokenExpiresAt));
    window.localStorage.setItem('rh_refresh_token_expires_at', String(refreshTokenExpiresAt));
    window.localStorage.setItem('rh_roles', JSON.stringify(authSession.roles || ['super_admin']));
    window.localStorage.setItem('rh_permissions', JSON.stringify(authSession.permissions || ['*']));
    window.localStorage.setItem('rh_scopes', JSON.stringify(authSession.scopes || ['global']));
  }, {
    authSession: session,
    accessTokenExpiresAt: now + (Math.max(accessExpiresInSeconds, 1) * 1000),
    refreshTokenExpiresAt: now + (Math.max(refreshExpiresInSeconds, 1) * 1000),
  });
}
