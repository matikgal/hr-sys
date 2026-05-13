/**
 * auth.setup.ts
 * Pobiera tokeny Firebase przez REST API i zapisuje je do pliku JSON.
 * Tokeny są następnie wstrzykiwane do IndexedDB przez fixtures.ts przed każdym testem.
 */
import { test as setup } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY!;
const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!;

const ACCOUNTS = [
  {
    email: process.env.TEST_ADMIN_EMAIL ?? 'admin@hr.local',
    password: process.env.TEST_ADMIN_PASSWORD ?? 'haslo123',
    file: 'e2e/.auth/admin.json',
  },
  {
    email: process.env.TEST_EMPLOYEE_EMAIL ?? 'user@hr.local',
    password: process.env.TEST_EMPLOYEE_PASSWORD ?? 'haslo123',
    file: 'e2e/.auth/employee.json',
  },
];

async function fetchFirebaseToken(email: string, password: string) {
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    }
  );
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Firebase login failed for ${email}: ${err}`);
  }
  return res.json() as Promise<{
    idToken: string;
    refreshToken: string;
    localId: string;
    email: string;
    displayName: string;
    expiresIn: string;
  }>;
}

for (const account of ACCOUNTS) {
  setup(`zapisz sesję: ${account.email}`, async () => {
    const token = await fetchFirebaseToken(account.email, account.password);
    fs.mkdirSync(path.dirname(account.file), { recursive: true });
    fs.writeFileSync(account.file, JSON.stringify({
      idToken: token.idToken,
      refreshToken: token.refreshToken,
      localId: token.localId,
      email: token.email,
      displayName: token.displayName,
      expiresIn: token.expiresIn,
      fetchedAt: Date.now(),
      projectId: PROJECT_ID,
      apiKey: API_KEY,
    }, null, 2));
    console.log(`✓ Token zapisany dla ${account.email} (uid: ${token.localId})`);
  });
}
