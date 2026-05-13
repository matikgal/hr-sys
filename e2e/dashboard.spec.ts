import { test, expect } from './fixtures';
import { waitForPageLoad } from './helpers';

test.describe('Dashboard — admin', () => {
  test.beforeEach(async ({ adminPage }) => {
    await adminPage.goto('/dashboard');
    await waitForPageLoad(adminPage);
  });

  test('wyświetla powitanie z imieniem', async ({ adminPage: page }) => {
    await expect(page.getByText(/dzień dobry/i)).toBeVisible({ timeout: 15_000 });
  });

  test('wyświetla aktualną datę', async ({ adminPage: page }) => {
    const months = ['stycznia','lutego','marca','kwietnia','maja','czerwca','lipca','sierpnia','września','października','listopada','grudnia'];
    await expect(page.getByText(new RegExp(months[new Date().getMonth()], 'i'))).toBeVisible({ timeout: 10_000 });
  });

  test('sekcja "Mój dzień" jest widoczna', async ({ adminPage: page }) => {
    await expect(page.getByText('Mój dzień')).toBeVisible({ timeout: 15_000 });
  });

  test('kafelek Czas pracy jest widoczny', async ({ adminPage: page }) => {
    await expect(page.locator('.rounded-2xl').filter({ hasText: 'Czas pracy' })).toBeVisible({ timeout: 15_000 });
  });

  test('kafelek Urlopy jest widoczny', async ({ adminPage: page }) => {
    await expect(page.getByText('Urlopy').first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/dni pozostało/i)).toBeVisible({ timeout: 15_000 });
  });

  test('kafelek Zadania jest widoczny', async ({ adminPage: page }) => {
    await expect(page.locator('.rounded-2xl').filter({ hasText: 'Zadania' })).toBeVisible({ timeout: 15_000 });
  });

  test('KPI karty są widoczne dla admina', async ({ adminPage: page }) => {
    await expect(page.getByText('Zatrudnionych')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('Obecność dzisiaj')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('Wnioski urlopowe').first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('Aktywne rekrutacje')).toBeVisible({ timeout: 15_000 });
  });

  test('sekcja "Trend zatrudnienia" jest widoczna', async ({ adminPage: page }) => {
    await expect(page.getByText('Trend zatrudnienia')).toBeVisible({ timeout: 15_000 });
  });

  test('sekcja "Struktura działów" jest widoczna', async ({ adminPage: page }) => {
    await expect(page.getByText('Struktura działów')).toBeVisible({ timeout: 15_000 });
  });

  test('przycisk "Nowy pracownik" jest widoczny', async ({ adminPage: page }) => {
    await expect(page.getByRole('button', { name: /nowy pracownik/i })).toBeVisible({ timeout: 15_000 });
  });

  test('sidebar zawiera wszystkie linki nawigacyjne', async ({ adminPage: page }) => {
    const names = ['Panel główny', 'Pracownicy', 'Czas pracy', 'Urlopy i nieobecności', 'Rekrutacja', 'Oceny roczne', 'Szkolenia', 'Benefity', 'Dokumenty', 'Ustawienia'];
    await Promise.all(names.map(name => expect(page.getByRole('link', { name })).toBeVisible({ timeout: 5_000 })));
  });
});
