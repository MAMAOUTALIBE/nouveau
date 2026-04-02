import { expect, test } from 'playwright/test';
import { primeRecruitmentAdminSession } from './helpers/auth-session';

test('recrutement campagnes: la grille charge sans erreur Grid.js', async ({ page }) => {
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

  await page.goto('/recrutement/campagnes');

  await expect(page.getByText('Campagnes de recrutement')).toBeVisible();
  await expect(page.getByText('An error happened while fetching the data')).toHaveCount(0);
  await expect(page.getByRole('gridcell', { name: 'CMP-PAIE-Q2' }).first()).toBeVisible();

  const gridRelatedErrors = runtimeErrors.filter((entry) => {
    const value = entry.toLowerCase();
    return value.includes('grid') || value.includes("reading 'length'") || value.includes('cannot read properties');
  });

  expect(gridRelatedErrors).toEqual([]);
});
