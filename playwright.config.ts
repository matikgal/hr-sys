import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 2,
  reporter: [['html', { open: 'never' }], ['list']],

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'off',
    // Współdziel kontekst przeglądarki między testami w tym samym pliku
    // Playwright domyślnie tworzy nowy kontekst na każdy test — zmieniamy na 'shared'
  },

  projects: [
    // Setup — pobiera tokeny Firebase przez REST API
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },
    // Testy admin — wszystkie poza employee.spec.ts
    {
      name: 'admin',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
      testIgnore: /employee\.spec\.ts/,
    },
    // Testy pracownik
    {
      name: 'employee',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
      testMatch: /employee\.spec\.ts/,
    },
  ],
});
