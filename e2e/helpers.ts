import { Page } from '@playwright/test';

/**
 * Czeka aż strona się załaduje — networkidle + znikną skeleton loadery
 */
export async function waitForPageLoad(page: Page, timeout = 8_000) {
  await page.waitForLoadState('domcontentloaded', { timeout }).catch(() => {});
  // Poczekaj aż znikną shadcn Skeleton (data-slot="skeleton")
  await page
    .locator('[data-slot="skeleton"]')
    .first()
    .waitFor({ state: 'hidden', timeout: 5_000 })
    .catch(() => {});
}

/** Zwraca datę w formacie yyyy-MM-dd z opcjonalnym przesunięciem dni */
export function dateStr(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
}
