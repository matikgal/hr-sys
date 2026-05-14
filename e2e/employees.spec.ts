import { test, expect } from './fixtures';
import { waitForPageLoad } from './helpers';

test.describe('Pracownicy — lista', () => {
  test.beforeEach(async ({ adminPage }) => {
    await adminPage.goto('/employees');
    await waitForPageLoad(adminPage);
  });

  test('strona pracowników ładuje się z nagłówkiem', async ({ adminPage: p }) => {
    await expect(p.getByRole('heading', { name: 'Katalog pracowników' })).toBeVisible({ timeout: 15_000 });
  });

  test('widoczne są karty statystyk', async ({ adminPage: p }) => {
    await expect(p.getByText('Wszyscy')).toBeVisible({ timeout: 15_000 });
    await expect(p.getByText('Aktywni')).toBeVisible({ timeout: 15_000 });
    await expect(p.getByText('Na urlopie')).toBeVisible({ timeout: 15_000 });
  });

  test('widoczny jest przycisk "Dodaj pracownika"', async ({ adminPage: p }) => {
    await expect(p.getByRole('button', { name: /dodaj pracownika/i })).toBeVisible({ timeout: 15_000 });
  });

  test('tabela ma poprawne nagłówki kolumn', async ({ adminPage: p }) => {
    await expect(p.getByRole('columnheader', { name: /pracownik/i })).toBeVisible({ timeout: 15_000 });
    await expect(p.getByRole('columnheader', { name: /status/i })).toBeVisible({ timeout: 15_000 });
  });

  test('tabela zawiera wiersze z pracownikami', async ({ adminPage: p }) => {
    await p.waitForSelector('table tbody tr', { timeout: 15_000 });
    await expect(p.locator('table tbody tr').first()).toBeVisible();
  });

  test('wyszukiwarka filtruje po nazwisku', async ({ adminPage: p }) => {
    const search = p.getByPlaceholder('Szukaj po nazwisku lub e-mailu…');
    await expect(search).toBeVisible({ timeout: 10_000 });
    await search.fill('xyzxyzxyz_nieistniejacy');
    await expect(p.getByText('Nie znaleziono pracowników.')).toBeVisible({ timeout: 5_000 });
    await search.clear();
  });

  test('filtry statusu są widoczne', async ({ adminPage: p }) => {
    await expect(p.getByRole('button', { name: 'Wszyscy' })).toBeVisible({ timeout: 10_000 });
    await expect(p.getByRole('button', { name: /^aktywni/i })).toBeVisible({ timeout: 10_000 });
  });

  test('kliknięcie wiersza otwiera panel boczny', async ({ adminPage: p }) => {
    await p.waitForSelector('table tbody tr', { timeout: 15_000 });
    await p.locator('table tbody tr').first().click();
    await expect(p.getByRole('tab', { name: 'Informacje' })).toBeVisible({ timeout: 8_000 });
    // Zamknij panel
    await p.getByRole('button', { name: 'Zamknij' }).click();
  });

  test('panel boczny zawiera dane pracownika', async ({ adminPage: p }) => {
    await p.waitForSelector('table tbody tr', { timeout: 15_000 });
    await p.locator('table tbody tr').first().click();
    await expect(p.getByText('E-MAIL')).toBeVisible({ timeout: 8_000 });
    await expect(p.getByRole('link', { name: 'Pełny profil' })).toBeVisible({ timeout: 5_000 });
    await p.getByRole('button', { name: 'Zamknij' }).click();
  });
});

test.describe('Pracownicy — dodawanie', () => {
  test.beforeEach(async ({ adminPage }) => {
    await adminPage.goto('/employees');
    await waitForPageLoad(adminPage);
    await adminPage.getByRole('button', { name: /dodaj pracownika/i }).click();
    await expect(adminPage.getByRole('dialog')).toBeVisible({ timeout: 8_000 });
  });

  test('dialog zawiera wszystkie pola', async ({ adminPage: p }) => {
    const dialog = p.getByRole('dialog');
    await expect(dialog.getByLabel(/imię/i)).toBeVisible();
    await expect(dialog.getByLabel(/nazwisko/i)).toBeVisible();
    await expect(dialog.getByLabel(/e-mail służbowy/i)).toBeVisible();
  });

  test('anulowanie zamyka dialog', async ({ adminPage: p }) => {
    await p.getByRole('button', { name: 'Anuluj' }).click();
    await expect(p.getByRole('dialog')).not.toBeVisible({ timeout: 5_000 });
  });

  test('walidacja — puste pola blokują submit', async ({ adminPage: p }) => {
    await p.getByRole('button', { name: 'Dodaj pracownika' }).click();
    await expect(p.getByRole('dialog')).toBeVisible();
    await p.getByRole('button', { name: 'Anuluj' }).click();
  });
});
