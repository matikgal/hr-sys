/**
 * login.spec.ts — testy strony logowania (bez sesji)
 */
import { test, expect } from '@playwright/test';

test.describe('Logowanie', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');
  });

  test('strona logowania wyświetla formularz', async ({ page }) => {
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toContainText('Zaloguj się');
  });

  test('widoczne są przyciski szybkiego logowania', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Admin' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'HR' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Manager' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Pracownik' })).toBeVisible();
  });

  test('poprawne logowanie przekierowuje na /dashboard', async ({ page }) => {
    await page.locator('#email').fill('admin@hr.local');
    await page.locator('#password').fill('haslo123');
    await page.locator('button[type="submit"]').click();
    await page.waitForURL('**/dashboard', { timeout: 20_000 });
    await expect(page).toHaveURL(/dashboard/);
  });

  test('błędne hasło pokazuje komunikat błędu', async ({ page }) => {
    await page.locator('#email').fill('admin@hr.local');
    await page.locator('#password').fill('bledne-haslo-xyz-999');
    await page.locator('button[type="submit"]').click();
    await expect(page).not.toHaveURL(/dashboard/, { timeout: 8_000 });
    await expect(page.locator('.bg-red-50').filter({ hasText: /nieprawidłowy/i }))
      .toBeVisible({ timeout: 8_000 });
  });

  test('niezalogowany użytkownik jest przekierowywany na /login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/login/, { timeout: 10_000 });
  });

  test('szybkie logowanie jako Admin działa', async ({ page }) => {
    await page.getByRole('button', { name: 'Admin' }).click();
    await page.waitForURL('**/dashboard', { timeout: 20_000 });
    await expect(page).toHaveURL(/dashboard/);
  });
});
