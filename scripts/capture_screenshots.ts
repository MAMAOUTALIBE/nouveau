/**
 * Script Playwright dédié à la capture des écrans pour la présentation
 * gouvernementale de RH-ADMIN V1.0 (cycle G2 — DRH Primature de Guinée).
 *
 * Usage : voir docs/presentation/README.md
 *
 *   npm run capture:screenshots
 *
 * Prérequis : backend FastAPI sur :8000 et frontend Angular sur :4200
 * doivent déjà tourner. Aucune création de serveur ici.
 *
 * Stratégie : on utilise le helper auth-session (POST /api/v1/auth/login
 * + bootstrap localStorage) pour traverser les guards Angular même si
 * jamais une page redirige vers /auth/login. La capture 01-login.png est
 * faite AVANT toute injection de session.
 *
 * Tolérance d'erreur : chaque capture est encapsulée dans un try/catch
 * qui logge un warning sans planter la suite (objectif : >= 12 captures
 * sur 15).
 */
import { expect, test, Page } from 'playwright/test';
import * as path from 'path';

const CAPTURES_DIR = path.join(__dirname, '..', 'docs', 'presentation', 'captures');

const SEED_EMAIL = 'spruko@admin.com';
const SEED_PASSWORD = 'sprukoadmin';

/**
 * Reproduit le helper tests/e2e/helpers/auth-session.ts mais en autonome
 * (pas d'import croisé, ce script ne fait pas partie de la suite e2e).
 */
async function primeAdminSession(page: Page): Promise<void> {
  await page.goto('/auth/login', { waitUntil: 'domcontentloaded' });

  // Réponse réelle du backend :
  //   {
  //     "user": { username, roles[], permissions[], scopes[], ... },
  //     "tokens": { access_token, refresh_token, access_expires_at, refresh_expires_at }
  //   }
  // Le backend pose AUSSI les cookies httpOnly rh_access/rh_refresh. Le
  // localStorage côté front sert seulement aux métadonnées de session
  // (roles, permissions, username, expirations) — voir auth.service.ts.
  type LoginResponse = {
    user?: {
      username?: string;
      roles?: string[];
      permissions?: string[];
      scopes?: string[];
    };
    tokens?: {
      access_token?: string;
      refresh_token?: string;
      access_expires_at?: string;
      refresh_expires_at?: string;
    };
  };

  const session = await page.evaluate(async (creds) => {
    const response = await window.fetch('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: creds.email, password: creds.password }),
      credentials: 'include',
    });
    if (!response.ok) {
      throw new Error(`Auth bootstrap failed (${response.status})`);
    }
    return response.json();
  }, { email: SEED_EMAIL, password: SEED_PASSWORD }) as LoginResponse;

  const now = Date.now();
  const accessToken = session.tokens?.access_token || '';
  const refreshToken = session.tokens?.refresh_token || '';
  const accessExpAt = session.tokens?.access_expires_at
    ? Date.parse(session.tokens.access_expires_at)
    : now + 30 * 60 * 1000;
  const refreshExpAt = session.tokens?.refresh_expires_at
    ? Date.parse(session.tokens.refresh_expires_at)
    : now + 24 * 3600 * 1000;
  const roles = session.user?.roles?.length ? session.user.roles : ['super_admin'];
  const permissions = session.user?.permissions?.length ? session.user.permissions : ['*'];
  // Le frontend stocke les scopes en minuscules (cf. access-control.service.ts).
  const rawScopes = session.user?.scopes?.length ? session.user.scopes : ['global'];
  const scopes = rawScopes.map((s) => s.toLowerCase());
  const username = session.user?.username || SEED_EMAIL;

  await page.evaluate(({ accessToken, refreshToken, accessExpAt, refreshExpAt, roles, permissions, scopes, username }) => {
    // Le token JWT est aussi dans le cookie httpOnly côté navigateur ; on
    // duplique en localStorage pour que les guards Angular qui regardent
    // ce KV soient satisfaits sur les pages capturées.
    window.localStorage.setItem('rh_token', accessToken);
    window.localStorage.setItem('rh_refresh_token', refreshToken);
    window.localStorage.setItem('rh_username', username);
    window.localStorage.setItem('rh_token_expires_at', String(accessExpAt));
    window.localStorage.setItem('rh_refresh_token_expires_at', String(refreshExpAt));
    window.localStorage.setItem('rh_roles', JSON.stringify(roles));
    window.localStorage.setItem('rh_permissions', JSON.stringify(permissions));
    window.localStorage.setItem('rh_scopes', JSON.stringify(scopes));
  }, { accessToken, refreshToken, accessExpAt, refreshExpAt, roles, permissions, scopes, username });
}

/**
 * Navigue vers `route`, attend networkidle + un petit délai pour les rendus
 * chart/echarts, et screenshote dans CAPTURES_DIR. En cas d'erreur (route
 * inexistante, redirect inattendu vers /acces-refuse, etc.), on logge un
 * warning et on continue : objectif >= 12 captures sur 15.
 */
async function captureRoute(
  page: Page,
  route: string,
  filename: string,
  opts: { waitMs?: number; fullPage?: boolean } = {},
): Promise<boolean> {
  const targetPath = path.join(CAPTURES_DIR, filename);
  try {
    const response = await page.goto(route, { waitUntil: 'domcontentloaded', timeout: 20_000 });
    if (response && response.status() >= 500) {
      console.warn(`[capture] ${filename} skipped — HTTP ${response.status()} pour ${route}`);
      return false;
    }
    try {
      await page.waitForLoadState('networkidle', { timeout: 8000 });
    } catch {
      // pas grave : certaines pages gardent des websockets ouverts
    }
    await page.waitForTimeout(opts.waitMs ?? 1200);

    // Si une page protégée redirige vers /auth/login ou /acces-refuse on
    // capture quand même, mais on prévient l'opérateur.
    const finalUrl = page.url();
    if (finalUrl.includes('/auth/login') && !route.includes('/auth/login')) {
      console.warn(`[capture] ${filename} : redirect inattendu vers /auth/login (route ${route})`);
    } else if (finalUrl.includes('/acces-refuse')) {
      console.warn(`[capture] ${filename} : redirect vers /acces-refuse (permissions)`);
    } else if (finalUrl.includes('/not-found')) {
      console.warn(`[capture] ${filename} : route ${route} introuvable (404 Angular)`);
      return false;
    }

    await page.screenshot({ path: targetPath, fullPage: opts.fullPage ?? false });
    console.log(`[capture] OK ${filename} (${route})`);
    return true;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[capture] SKIP ${filename} (${route}) : ${msg}`);
    return false;
  }
}

test.describe.serial('Captures presentation gouv RH-ADMIN V1.0', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
  });

  test('01 page de connexion (sans remplir)', async ({ page }) => {
    await page.goto('/auth/login', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    await page.screenshot({
      path: path.join(CAPTURES_DIR, '01-login.png'),
      fullPage: false,
    });
    console.log('[capture] OK 01-login.png');
    // Sanity : on a bien l'écran de connexion.
    await expect(page.getByRole('button', { name: 'Se connecter' })).toBeVisible();
  });

  test('02-15 parcours authentifié', async ({ page }) => {
    // Bootstrap session (cookie httpOnly côté backend + meta côté localStorage).
    await primeAdminSession(page);

    // 02 — Tableau de bord par défaut (route racine post-login)
    await captureRoute(page, '/dashboard', '02-dashboard.png', { waitMs: 1800 });

    // 03 — Liste des agents
    await captureRoute(page, '/personnel/agents', '03-personnel-liste.png', { waitMs: 1600 });

    // 04 — Fiche du premier agent. On clique sur la première ligne pour
    // attraper un id réel ; à défaut on tente un fallback connu.
    try {
      await page.goto('/personnel/agents', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => undefined);
      await page.waitForTimeout(1500);
      // Tente de cliquer sur la première ligne de tableau (lien vers la fiche).
      const firstRowLink = page.locator('a[href*="/personnel/agents/"]').first();
      const visible = await firstRowLink.isVisible().catch(() => false);
      if (visible) {
        await firstRowLink.click();
        await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => undefined);
        await page.waitForTimeout(1500);
        await page.screenshot({
          path: path.join(CAPTURES_DIR, '04-personnel-detail.png'),
          fullPage: false,
        });
        console.log('[capture] OK 04-personnel-detail.png (via click ligne)');
      } else {
        console.warn('[capture] SKIP 04-personnel-detail.png : aucune ligne agent cliquable');
      }
    } catch (err) {
      console.warn(`[capture] SKIP 04-personnel-detail.png : ${err instanceof Error ? err.message : err}`);
    }

    // 05 — Formulaire création agent
    await captureRoute(page, '/personnel/agents/nouveau', '05-personnel-nouveau.png', {
      waitMs: 1600,
    });

    // 06 — Vue doublons : sur la liste, on ouvre les filtres avancés s'ils
    // existent. À défaut, on capture la liste avec un état de recherche
    // censé déclencher l'affichage "doublons potentiels".
    try {
      await page.goto('/personnel/agents', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => undefined);
      await page.waitForTimeout(1200);
      // Tente d'ouvrir les filtres avancés (bouton "Filtres", "Filtres avancés", etc.)
      const filterButton = page
        .getByRole('button', { name: /filtres?|avanc|doublons?/i })
        .first();
      const filterVisible = await filterButton.isVisible().catch(() => false);
      if (filterVisible) {
        await filterButton.click();
        await page.waitForTimeout(900);
      }
      await page.screenshot({
        path: path.join(CAPTURES_DIR, '06-personnel-doublons.png'),
        fullPage: false,
      });
      console.log('[capture] OK 06-personnel-doublons.png');
    } catch (err) {
      console.warn(`[capture] SKIP 06-personnel-doublons.png : ${err instanceof Error ? err.message : err}`);
    }

    // 07 — Documents
    await captureRoute(page, '/documents', '07-documents.png', { waitMs: 1500 });

    // 08 — Recrutement campagnes
    await captureRoute(page, '/recrutement/campagnes', '08-recrutement-campagnes.png', {
      waitMs: 1500,
    });

    // 09 — Recrutement candidatures
    await captureRoute(page, '/recrutement/candidatures', '09-recrutement-candidatures.png', {
      waitMs: 1500,
    });

    // 10 — Congés / absences
    await captureRoute(page, '/absences', '10-conges.png', { waitMs: 1500 });

    // 11 — Évaluation (campagnes)
    await captureRoute(page, '/evaluation', '11-evaluation.png', { waitMs: 1500 });

    // 12 — Formation (sessions)
    await captureRoute(page, '/formation', '12-formation.png', { waitMs: 1500 });

    // 13 — Dashboard Operations
    await captureRoute(page, '/dashboard/operations', '13-tableau-bord-operations.png', {
      waitMs: 2000,
    });

    // 14 — Dashboard Pilotage
    await captureRoute(page, '/dashboard/pilotage', '14-tableau-bord-pilotage.png', {
      waitMs: 2000,
    });

    // 15 — Modernisation RH
    await captureRoute(page, '/modernisation-rh', '15-modernisation.png', { waitMs: 1800 });
  });
});
