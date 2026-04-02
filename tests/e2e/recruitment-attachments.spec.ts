import { expect, test } from 'playwright/test';
import { primeRecruitmentAdminSession } from './helpers/auth-session';

test('recrutement candidatures: visualiser et telecharger une piece jointe', async ({ page }) => {
  await primeRecruitmentAdminSession(page);
  await page.goto('/recrutement/candidatures');

  await page.getByRole('button', { name: 'Nouvelle candidature' }).click();

  await page.locator('input[formcontrolname="candidate"]').fill('Candidat E2E');
  await page.locator('input[formcontrolname="position"]').fill('Analyste Recrutement');
  await page.locator('input[formcontrolname="campaign"]').fill('CMP-PAIE-Q2');
  await page.locator('input[formcontrolname="receivedOn"]').fill('2026-03-31');

  const fileInput = page.locator('input[type="file"][multiple]').first();
  await fileInput.setInputFiles('tests/e2e/fixtures/cv-e2e.pdf');

  const uploadedRow = page.locator('li.list-group-item', { hasText: 'cv-e2e.pdf' }).first();
  await expect(uploadedRow).toBeVisible();

  const previewLink = uploadedRow.getByRole('link', { name: 'Voir' });
  await expect(previewLink).toHaveAttribute('href', /\/api\/v1\/public\/uploads\/.*disposition=inline/i);

  const previewPopupPromise = page.waitForEvent('popup');
  await previewLink.click();
  const previewPopup = await previewPopupPromise;
  await previewPopup.close();

  const downloadOutcomePromise = Promise.race([
    page.waitForEvent('download', { timeout: 10_000 }).then((download) => ({ type: 'download' as const, download })),
    page.waitForEvent('popup', { timeout: 10_000 }).then((popup) => ({ type: 'popup' as const, popup })),
  ]);

  await uploadedRow.getByRole('link', { name: 'Telecharger' }).click();
  const outcome = await downloadOutcomePromise;

  if (outcome.type === 'download') {
    expect(outcome.download.suggestedFilename().toLowerCase()).toContain('.pdf');
  } else {
    await outcome.popup.waitForLoadState('domcontentloaded');
    await expect(outcome.popup).toHaveURL(/\/api\/v1\/public\/uploads\//i);
    await outcome.popup.close();
  }
});
