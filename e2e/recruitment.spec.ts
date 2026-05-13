import { test, expect } from './fixtures';
import { waitForPageLoad } from './helpers';

test.describe('Rekrutacja — ATS (admin)', () => {
  test.beforeEach(async ({ adminPage }) => {
    await adminPage.goto('/recruitment');
    await waitForPageLoad(adminPage);
  });

  test('strona rekrutacji ładuje się z nagłówkiem', async ({ adminPage: p }) => {
    await expect(p.getByRole('heading', { name: 'Rekrutacja (ATS)' })).toBeVisible({ timeout: 15_000 });
  });

  test('widoczny jest przycisk "Dodaj ogłoszenie"', async ({ adminPage: p }) => {
    await expect(p.getByRole('button', { name: /dodaj ogłoszenie/i })).toBeVisible({ timeout: 15_000 });
  });

  test('widoczne są zakładki Kanban i Ogłoszenia', async ({ adminPage: p }) => {
    await expect(p.getByRole('tab', { name: /tablica kanban/i })).toBeVisible({ timeout: 10_000 });
    await expect(p.getByRole('tab', { name: /ogłoszenia/i })).toBeVisible({ timeout: 10_000 });
  });

  test('tablica kanban zawiera kolumny etapów', async ({ adminPage: p }) => {
    for (const stage of ['Nowi', 'Screening', 'Wywiad', 'Oferta', 'Zatrudnieni', 'Odrzuceni']) {
      await expect(p.getByText(stage).first()).toBeVisible({ timeout: 10_000 });
    }
  });

  test('wyszukiwarka kandydatów jest widoczna', async ({ adminPage: p }) => {
    await expect(p.getByPlaceholder('Szukaj kandydata...')).toBeVisible({ timeout: 10_000 });
  });

  test('wyszukiwarka filtruje kandydatów', async ({ adminPage: p }) => {
    const search = p.getByPlaceholder('Szukaj kandydata...');
    await search.fill('xyzxyzxyz_nieistniejacy');
    await expect(p.getByText('Brak kandydatów').first()).toBeVisible({ timeout: 5_000 });
    await search.clear();
  });
});

test.describe('Rekrutacja — dodawanie ogłoszenia', () => {
  test.beforeEach(async ({ adminPage }) => {
    await adminPage.goto('/recruitment');
    await waitForPageLoad(adminPage);
    await adminPage.getByRole('button', { name: /dodaj ogłoszenie/i }).click();
    await expect(adminPage.getByRole('dialog')).toBeVisible({ timeout: 8_000 });
  });

  test('dialog zawiera wszystkie pola formularza', async ({ adminPage: p }) => {
    const dialog = p.getByRole('dialog');
    await expect(dialog.getByLabel('Tytuł stanowiska')).toBeVisible();
    await expect(dialog.getByLabel('Dział')).toBeVisible();
    await expect(dialog.getByLabel(/widełki płacowe/i)).toBeVisible();
  });

  test('anulowanie zamyka dialog', async ({ adminPage: p }) => {
    await p.getByRole('button', { name: 'Anuluj' }).click();
    await expect(p.getByRole('dialog')).not.toBeVisible({ timeout: 5_000 });
  });

  test('walidacja — puste wymagane pola blokują submit', async ({ adminPage: p }) => {
    await p.getByRole('button', { name: 'Opublikuj' }).click();
    await expect(p.getByRole('dialog')).toBeVisible();
    await p.getByRole('button', { name: 'Anuluj' }).click();
  });
});
