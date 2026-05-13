import { test, expect } from './fixtures';
import { waitForPageLoad, dateStr } from './helpers';

test.describe('Urlopy — widok listy', () => {
  test.beforeEach(async ({ adminPage }) => {
    await adminPage.goto('/leaves');
    await waitForPageLoad(adminPage);
  });

  test('strona urlopów ładuje się z nagłówkiem', async ({ adminPage: p }) => {
    await expect(p.getByRole('heading', { name: 'Wnioski urlopowe' })).toBeVisible({ timeout: 15_000 });
  });

  test('widoczne są trzy karty statystyk', async ({ adminPage: p }) => {
    await expect(p.getByText('Saldo urlopowe')).toBeVisible({ timeout: 15_000 });
    await expect(p.getByText('W oczekiwaniu')).toBeVisible({ timeout: 15_000 });
    await expect(p.getByText('Dzisiejsze nieobecności')).toBeVisible({ timeout: 15_000 });
  });

  test('widoczny jest przycisk "Nowy wniosek"', async ({ adminPage: p }) => {
    await expect(p.getByRole('button', { name: /nowy wniosek/i })).toBeVisible({ timeout: 15_000 });
  });

  test('widoczny jest przycisk "Eksportuj CSV"', async ({ adminPage: p }) => {
    await expect(p.getByRole('button', { name: /eksportuj csv/i })).toBeVisible({ timeout: 15_000 });
  });

  test('tabela ma poprawne nagłówki kolumn', async ({ adminPage: p }) => {
    await expect(p.getByRole('columnheader', { name: /pracownik/i })).toBeVisible({ timeout: 15_000 });
    await expect(p.getByRole('columnheader', { name: /typ urlopu/i })).toBeVisible({ timeout: 15_000 });
    await expect(p.getByRole('columnheader', { name: /status/i })).toBeVisible({ timeout: 15_000 });
  });

  test('wyszukiwarka filtruje wyniki', async ({ adminPage: p }) => {
    const search = p.getByPlaceholder('Szukaj pracownika...');
    await expect(search).toBeVisible({ timeout: 10_000 });
    await search.fill('xyzxyzxyz_nieistniejacy');
    await expect(p.getByText('Brak wniosków urlopowych.')).toBeVisible({ timeout: 5_000 });
    await search.clear();
  });

  test('zakładki Lista i Kalendarz są widoczne', async ({ adminPage: p }) => {
    await expect(p.getByRole('tab', { name: 'Lista' })).toBeVisible({ timeout: 10_000 });
    await expect(p.getByRole('tab', { name: 'Kalendarz zespołu' })).toBeVisible({ timeout: 10_000 });
  });
});

test.describe('Urlopy — formularz nowego wniosku', () => {
  test.beforeEach(async ({ adminPage }) => {
    await adminPage.goto('/leaves');
    await waitForPageLoad(adminPage);
    await adminPage.getByRole('button', { name: /nowy wniosek/i }).click();
    await expect(adminPage.getByRole('heading', { name: 'Nowy wniosek urlopowy' })).toBeVisible({ timeout: 8_000 });
  });

  test('formularz zawiera wszystkie pola', async ({ adminPage: p }) => {
    await expect(p.getByLabel('Typ urlopu')).toBeVisible();
    await expect(p.getByLabel('Data rozpoczęcia')).toBeVisible();
    await expect(p.getByLabel('Data zakończenia')).toBeVisible();
    await expect(p.getByRole('button', { name: 'Złóż wniosek' })).toBeVisible();
    await expect(p.getByRole('button', { name: 'Anuluj' })).toBeVisible();
  });

  test('select typu urlopu ma wszystkie opcje', async ({ adminPage: p }) => {
    const select = p.getByLabel('Typ urlopu');
    await expect(select.locator('option[value="vacation"]')).toHaveText('Wypoczynkowy');
    await expect(select.locator('option[value="sick"]')).toHaveText('Chorobowy');
    await expect(select.locator('option[value="paternity"]')).toHaveText('Ojcowski');
    await expect(select.locator('option[value="unpaid"]')).toHaveText('Bezpłatny');
  });

  test('anulowanie zamyka formularz', async ({ adminPage: p }) => {
    await p.getByRole('button', { name: 'Anuluj' }).click();
    await expect(p.getByRole('heading', { name: 'Nowy wniosek urlopowy' })).not.toBeVisible({ timeout: 5_000 });
  });

  test('walidacja — data końca wcześniejsza niż start pokazuje błąd', async ({ adminPage: p }) => {
    await p.getByLabel('Data rozpoczęcia').fill(dateStr(5));
    await p.getByLabel('Data zakończenia').fill(dateStr(1));
    await p.getByRole('button', { name: 'Złóż wniosek' }).click();
    await expect(p.getByText(/data zakończenia nie może być wcześniejsza/i)).toBeVisible({ timeout: 5_000 });
    await p.getByRole('button', { name: 'Anuluj' }).click();
  });

  test('urlop chorobowy jest automatycznie zatwierdzany', async ({ adminPage: p }) => {
    await p.getByLabel('Typ urlopu').selectOption('sick');
    await p.getByLabel('Data rozpoczęcia').fill(dateStr(1));
    await p.getByLabel('Data zakończenia').fill(dateStr(3));
    await p.getByRole('button', { name: 'Złóż wniosek' }).click();
    await expect(p.getByRole('heading', { name: 'Nowy wniosek urlopowy' })).not.toBeVisible({ timeout: 15_000 });
    await expect(p.getByText('Auto-zatwierdzony')).toBeVisible({ timeout: 10_000 });
  });

  test('urlop wypoczynkowy >= 3 dni trafia jako oczekujący', async ({ adminPage: p }) => {
    await p.getByLabel('Typ urlopu').selectOption('vacation');
    await p.getByLabel('Data rozpoczęcia').fill(dateStr(20));
    await p.getByLabel('Data zakończenia').fill(dateStr(25));
    await p.getByRole('button', { name: 'Złóż wniosek' }).click();
    await expect(p.getByRole('heading', { name: 'Nowy wniosek urlopowy' })).not.toBeVisible({ timeout: 15_000 });
    await expect(p.getByText('Oczekujący').first()).toBeVisible({ timeout: 10_000 });
  });
});

test.describe('Urlopy — kalendarz zespołu', () => {
  test.beforeEach(async ({ adminPage }) => {
    await adminPage.goto('/leaves');
    await waitForPageLoad(adminPage);
    await adminPage.getByRole('tab', { name: 'Kalendarz zespołu' }).click();
  });

  test('kalendarz wyświetla aktualny miesiąc', async ({ adminPage: p }) => {
    const months = ['styczeń','luty','marzec','kwiecień','maj','czerwiec','lipiec','sierpień','wrzesień','październik','listopad','grudzień'];
    await expect(p.getByText(new RegExp(months[new Date().getMonth()], 'i'))).toBeVisible({ timeout: 8_000 });
  });

  test('widoczne są nazwy dni tygodnia', async ({ adminPage: p }) => {
    for (const day of ['Pn', 'Wt', 'Śr', 'Cz', 'Pt']) {
      await expect(p.getByText(day)).toBeVisible({ timeout: 5_000 });
    }
  });

  test('legenda kalendarza jest widoczna', async ({ adminPage: p }) => {
    await expect(p.getByText('Zatwierdzone')).toBeVisible({ timeout: 5_000 });
    await expect(p.getByText('Oczekujące')).toBeVisible({ timeout: 5_000 });
  });
});
