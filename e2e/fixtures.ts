/**
 * fixtures.ts
 *
 * Optymalizacja: adminPage i employeePage mają scope: 'worker' —
 * jedna instancja przeglądarki na cały worker, logowanie raz.
 * Każdy test dostaje tę samą stronę i tylko nawiguje do potrzebnego URL.
 *
 * Czas: ~15s pierwsze logowanie, ~1-2s każdy kolejny test (samo goto).
 */
import { test as base, Page, Browser } from '@playwright/test';
import * as fs from 'fs';

export type AuthRole = 'admin' | 'employee';

interface TokenData {
  idToken: string;
  refreshToken: string;
  localId: string;
  email: string;
  displayName: string;
  expiresIn: string;
  fetchedAt: number;
  projectId: string;
  apiKey: string;
}

export function loadToken(role: AuthRole): TokenData {
  const file = `e2e/.auth/${role}.json`;
  if (!fs.existsSync(file)) {
    throw new Error(`Brak pliku sesji: ${file}. Uruchom: npx playwright test --project=setup`);
  }
  return JSON.parse(fs.readFileSync(file, 'utf-8'));
}

const INIT_SCRIPT = (t: TokenData) => {
  const DB_NAME = 'firebaseLocalStorageDb';
  const STORE_NAME = 'firebaseLocalStorage';
  const key = `firebase:authUser:${t.apiKey}:[DEFAULT]`;
  const authUser = {
    uid: t.localId, email: t.email, emailVerified: true,
    displayName: t.displayName || null, isAnonymous: false,
    providerData: [{ providerId: 'password', uid: t.email, displayName: t.displayName || null, email: t.email, phoneNumber: null, photoURL: null }],
    stsTokenManager: { refreshToken: t.refreshToken, accessToken: t.idToken, expirationTime: Date.now() + parseInt(t.expiresIn) * 1000 },
    createdAt: String(Date.now()), lastLoginAt: String(Date.now()),
    apiKey: t.apiKey, appName: '[DEFAULT]',
  };
  const req = indexedDB.open(DB_NAME, 1);
  req.onupgradeneeded = (e: any) => {
    const db = e.target.result;
    if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME, { keyPath: 'fbase_key' });
  };
  req.onsuccess = (e: any) => {
    const db = e.target.result;
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put({ fbase_key: key, value: authUser });
    tx.oncomplete = () => db.close();
  };
};

async function createLoggedInPage(browser: Browser, role: AuthRole): Promise<Page> {
  const token = loadToken(role);
  const context = await browser.newContext({ baseURL: 'http://localhost:3000' });
  const page = await context.newPage();
  // Wstrzyknij token przed każdym goto
  await page.addInitScript(INIT_SCRIPT, token);
  // Pierwsze goto — Firebase SDK inicjalizuje się z tokenem z IndexedDB
  await page.goto('/dashboard');
  await page.waitForURL('**/dashboard', { timeout: 20_000 });
  return page;
}

// ── Worker-scoped fixtures — logowanie raz na cały worker ────────────────────

export const test = base.extend<
  { adminPage: Page; employeePage: Page },
  { sharedAdminPage: Page; sharedEmployeePage: Page }
>({
  // Worker-scope: tworzone raz, współdzielone między wszystkimi testami w workerze
  sharedAdminPage: [async ({ browser }, use) => {
    const page = await createLoggedInPage(browser, 'admin');
    await use(page);
    await page.context().close();
  }, { scope: 'worker' }],

  sharedEmployeePage: [async ({ browser }, use) => {
    const page = await createLoggedInPage(browser, 'employee');
    await use(page);
    await page.context().close();
  }, { scope: 'worker' }],

  // Test-scope: przekazuje worker-scope page do testu
  adminPage: async ({ sharedAdminPage }, use) => {
    await use(sharedAdminPage);
  },

  employeePage: async ({ sharedEmployeePage }, use) => {
    await use(sharedEmployeePage);
  },
});

export { expect } from '@playwright/test';

/**
 * Nawiguje na URL jako dany role.
 * Używaj z worker-scope page — nie loguje się ponownie, tylko nawiguje.
 */
export async function gotoAs(page: Page, _role: AuthRole, url: string) {
  // Strona jest już zalogowana (worker-scope) — tylko nawiguj
  await page.goto(url);
  await page.waitForLoadState('domcontentloaded');
}
