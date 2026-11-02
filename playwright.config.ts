import { defineConfig, devices } from '@playwright/test';

// Teste de la un capat la altul pentru traseele critice. Rulare: `npm run build`, apoi `npm run test:e2e`.
// Pe alt server: `E2E_BASE_URL=https://www.radikal.blog npm run test:e2e`.
const baseURL = process.env.E2E_BASE_URL || 'http://localhost:3800';

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  retries: 0,
  reporter: [['list']],
  use: { ...devices['Pixel 7'], baseURL },
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : { command: 'npm run start -- -p 3800', url: baseURL, reuseExistingServer: true, timeout: 120_000 },
});
