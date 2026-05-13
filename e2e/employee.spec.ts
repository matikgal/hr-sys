import { test, expect } from './fixtures';
import { waitForPageLoad, dateStr } from './helpers';

test.describe('Pracownik — dashboard', () => {
  test.beforeEach(async ({ employeePage }) => {
    await employeePage.goto('/dashboard');
    await waitForPageLoad(employeePage);
  });

  test('pracownik widzi dashboard z powitaniem', async ({ employeePage: p }) => {
    await expect(p.getByText(/dzień dobry/i)).toBeVisible({ timeout: 15_000 });
  });

  test('pracownik widzi sekcję "Mój dzień"', async ({ employeePage: p }) => {
    await expect(p.getByText('Mój dzień')).toBeVisible({ timeout: 15_000 });
  });

  test('pracownik NIE widzi KPI kart zarządczych', async ({ employeePage: p }) => {
    await p.waitForLoadState('networkidle');
    await expect(p.getByText('Zatrudnionych')).not.toBeVisible();
    await expect(p.getByText('Aktywne rekrutacje')).not.toBeVisible();
  });

  test('pracownik NIE widzi przycisku "Nowy pracownik"', async ({ employeePage: p }) => {
    await p.waitForLoadState('networkidle');
    await expect(p.getByRole('button', { name: /nowy pracownik/i })).not.toBeVisible();
  });
});

test.describe('Pracownik — urlopy', () => {
  test.beforeEach(async ({ employeePage }) => {
    await employeePage.goto('/leaves');
    await waitForPageLoad(employeePage);
  });

  test('pracownik widzi stronę urlopów', async ({ employeePage: p }) => {
    await expect(p.getByRole('heading', { name: 'Wnioski urlopowe' })).toBeVisible({ timeout: 15_000 });
  });

  test('pracownik widzi swoje saldo urlopowe', async ({ employeePage: p }) => {
    await expect(p.getByText('Saldo urlopowe')).toBeVisible({ timeout: 15_000 });
    await expect(p.getByText(/dni pozostało/i)).toBeVisible({ timeout: 15_000 });
  });

  test('pracownik NIE widzi przycisku "Eksportuj CSV"', async ({ employeePage: p }) => {
    await p.waitForLoadState('networkidle');
    await expect(p.getByRole('button', { name: /eksportuj csv/i })).not.toBeVisible();
  });

  test('pracownik NIE widzi przycisków Zatwierdź/Odrzuć', async ({ employeePage: p }) => {
    await p.waitForLoadState('networkidle');
    await expect(p.getByRole('button', { name: /zatwierdź/i })).not.toBeVisible();
    await expect(p.getByRole('button', { name: /odrzuć/i })).not.toBeVisible();
  });

  test('pracownik może złożyć wniosek o urlop chorobowy (auto-zatwierdzony)', async ({ employeePage: p }) => {
    await p.getByRole('button', { name: /nowy wniosek/i }).click();
    await expect(p.getByRole('heading', { name: 'Nowy wniosek urlopowy' })).toBeVisible({ timeout: 8_000 });
    await p.getByLabel('Typ urlopu').selectOption('sick');
    await p.getByLabel('Data rozpoczęcia').fill(dateStr(2));
    await p.getByLabel('Data zakończenia').fill(dateStr(4));
    await p.getByRole('button', { name: 'Złóż wniosek' }).click();
    await expect(p.getByRole('heading', { name: 'Nowy wniosek urlopowy' })).not.toBeVisible({ timeout: 15_000 });
    await expect(p.getByText('Auto-zatwierdzony')).toBeVisible({ timeout: 10_000 });
  });
});

test.describe('Pracownik — rekrutacja (job board)', () => {
  test.beforeEach(async ({ employeePage }) => {
    await employeePage.goto('/recruitment');
    await waitForPageLoad(employeePage);
  });

  test('pracownik widzi job board, nie ATS', async ({ employeePage: p }) => {
    await expect(p.getByText('Otwarte oferty pracy')).toBeVisible({ timeout: 15_000 });
    await expect(p.getByRole('heading', { name: 'Rekrutacja (ATS)' })).not.toBeVisible();
  });

  test('pracownik widzi sekcję "Moje aplikacje"', async ({ employeePage: p }) => {
    await expect(p.getByText('Moje aplikacje')).toBeVisible({ timeout: 15_000 });
  });

  test('pracownik NIE widzi przycisku "Dodaj ogłoszenie"', async ({ employeePage: p }) => {
    await p.waitForLoadState('networkidle');
    await expect(p.getByRole('button', { name: /dodaj ogłoszenie/i })).not.toBeVisible();
  });
});
