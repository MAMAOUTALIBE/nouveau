import { expect, test } from 'playwright/test';

/**
 * E2E sur le parcours d'authentification cookie-only.
 *
 * Comptes de seed (`backend/scripts/seed_initial.py`):
 *   - spruko@admin.com / sprukoadmin (legacy, role super_admin)
 *
 * Le backend pose les cookies `rh_access` et `rh_refresh` en httpOnly. On
 * vérifie côté contexte Playwright (non côté window) que ces cookies sont
 * bien posés, et que `localStorage.rh_token` reste vide (preuve qu'aucun
 * JWT n'est exposé côté JS).
 */

test.describe('Authentication: login / logout', () => {
  test('login OK pose un cookie httpOnly et ne stocke pas le token en localStorage', async ({
    page,
    context,
  }) => {
    await page.goto('/auth/login');

    await page.getByLabel('Adresse e-mail').fill('spruko@admin.com');
    // L'input mot de passe peut etre en mode "password" ou "text" selon le
    // toggle — on cible par label pour rester stable.
    await page.getByLabel(/^Mot de passe$/).fill('sprukoadmin');

    await Promise.all([
      page.waitForURL((url) => !url.pathname.startsWith('/auth/login'), { timeout: 15_000 }),
      page.getByRole('button', { name: 'Se connecter' }).click(),
    ]);

    // Un cookie httpOnly d'access doit être présent côté contexte.
    const cookies = await context.cookies();
    const accessCookie = cookies.find((cookie) => cookie.name === 'rh_access');
    expect(accessCookie, 'le cookie httpOnly rh_access doit être posé par le backend').toBeDefined();
    expect(accessCookie?.httpOnly).toBe(true);

    // Le JWT brut ne doit jamais transiter par localStorage (P0 cookie-only).
    const tokenInStorage = await page.evaluate(() => window.localStorage.getItem('rh_token'));
    expect(tokenInStorage).toBeNull();

    // Méta-données UX OK pour l'interface (username, expirations).
    const usernameInStorage = await page.evaluate(() => window.localStorage.getItem('rh_username'));
    expect(usernameInStorage).toBeTruthy();
  });

  test('login KO sur mauvais mot de passe affiche un toast et reste sur /auth/login', async ({
    page,
  }) => {
    await page.goto('/auth/login');

    await page.getByLabel('Adresse e-mail').fill('spruko@admin.com');
    await page.getByLabel(/^Mot de passe$/).fill('mauvais-mot-de-passe');

    await page.getByRole('button', { name: 'Se connecter' }).click();

    // Toast d'erreur visible (anti-énumération : même message peu importe la
    // cause exacte).
    await expect(page.getByText('Identifiants invalides').first()).toBeVisible({ timeout: 8_000 });
    // Toujours sur la page de login.
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('logout efface les cookies et empêche un accès direct à /personnel/agents', async ({
    page,
    context,
  }) => {
    // Login direct via UI pour rester fidèle au parcours utilisateur.
    await page.goto('/auth/login');
    await page.getByLabel('Adresse e-mail').fill('spruko@admin.com');
    await page.getByLabel(/^Mot de passe$/).fill('sprukoadmin');
    await Promise.all([
      page.waitForURL((url) => !url.pathname.startsWith('/auth/login'), { timeout: 15_000 }),
      page.getByRole('button', { name: 'Se connecter' }).click(),
    ]);

    // Logout via l'API publique (l'UI peut varier — on s'aligne sur l'effet
    // observable : cookies effacés + redirection si on tente de revenir).
    await page.evaluate(async () => {
      await window.fetch('/api/v1/auth/logout', { method: 'POST', credentials: 'include' });
    });
    await page.evaluate(() => window.localStorage.clear());

    // Les cookies httpOnly d'auth doivent être effacés par le serveur.
    const cookiesAfter = await context.cookies();
    expect(cookiesAfter.find((cookie) => cookie.name === 'rh_access')).toBeUndefined();

    // Un accès direct à une route protégée doit rediriger vers /auth/login.
    await page.goto('/personnel/agents');
    await expect(page).toHaveURL(/\/auth\/login/);
  });
});
