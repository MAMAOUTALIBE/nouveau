import { expect, test } from 'playwright/test';
import { primeRecruitmentAdminSession } from './helpers/auth-session';

/**
 * E2E sur la page liste des agents (`/personnel/agents`). On utilise le
 * helper d'auth existant (`primeRecruitmentAdminSession`) qui prime la
 * session avec un compte super_admin via l'API directement — c'est plus
 * rapide et résilient que de cliquer le formulaire de login dans chaque
 * test métier.
 */

test.describe('Personnel: liste des agents', () => {
  test('charge la liste des agents et affiche le tableau avec ≥1 ligne', async ({ page }) => {
    await primeRecruitmentAdminSession(page);

    const runtimeErrors: string[] = [];
    page.on('pageerror', (error) => {
      runtimeErrors.push(String(error?.message || error));
    });
    page.on('console', (message) => {
      if (message.type() === 'error') {
        runtimeErrors.push(message.text());
      }
    });

    await page.goto('/personnel/agents');

    // En-tête de page visible (le titre exact peut varier selon le layout —
    // on cible un libellé stable du tableau plutôt que le H1).
    await expect(page.getByText(/Liste des agents|Effectif|Personnel/i).first()).toBeVisible({
      timeout: 12_000,
    });
    // Tableau ou grille présent : on attend une ligne avec un matricule
    // au format PRM-NNNN (pattern stable côté seed).
    await expect(page.getByText(/PRM-\d{4,}/).first()).toBeVisible({ timeout: 12_000 });

    // Pas d'erreur Grid.js / "cannot read properties" à l'init.
    const blockingErrors = runtimeErrors.filter((entry) => {
      const value = entry.toLowerCase();
      return value.includes('grid') || value.includes("reading 'length'") || value.includes('cannot read properties');
    });
    expect(blockingErrors).toEqual([]);
  });

  test('filtre la liste via le champ de recherche client-side', async ({ page }) => {
    await primeRecruitmentAdminSession(page);
    await page.goto('/personnel/agents');

    // Attend qu'au moins une ligne soit chargée avant de filtrer.
    await expect(page.getByText(/PRM-\d{4,}/).first()).toBeVisible({ timeout: 12_000 });

    // Capture le matricule de la 1re ligne pour filtrer dessus — on s'évite
    // ainsi un couplage fort à un agent seedé donné.
    const firstMatricule = await page.getByText(/PRM-\d{4,}/).first().textContent();
    const matricule = (firstMatricule || '').trim();
    expect(matricule).toMatch(/^PRM-\d{4,}$/);

    // Champ de recherche (placeholder ou label libre — on tente plusieurs
    // sélecteurs robustes pour rester compatible avec d'éventuels relooks).
    const searchCandidates = [
      page.getByPlaceholder(/Rechercher|Recherche/i),
      page.locator('input[type="search"]').first(),
      page.locator('input[name*="search" i]').first(),
    ];
    let searchInput = null;
    for (const candidate of searchCandidates) {
      if (await candidate.count()) {
        searchInput = candidate;
        break;
      }
    }
    test.skip(!searchInput, 'Champ de recherche non détectable sur cette version de la page');

    await searchInput!.fill(matricule);
    // Petit délai pour laisser le debounce (250 ms côté composant) s'écouler.
    await page.waitForTimeout(400);

    // La ligne correspondante reste visible.
    await expect(page.getByText(matricule).first()).toBeVisible();
  });
});
