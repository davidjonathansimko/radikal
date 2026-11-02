import { test, expect, type Page } from '@playwright/test';

// Vizitator (fara cont), tutorial terminat, ca sa ajungem direct la continut.
async function enter(page: Page, path = '/') {
  await page.addInitScript(() => {
    sessionStorage.setItem('radikalGuestMode', '1');
    localStorage.setItem('radikalOnboardingDone', '1');
    localStorage.setItem('cookie-consent', JSON.stringify({ necessary: true, analytics: false, marketing: false, timestamp: Date.now() }));
  });
  await page.goto(path);
}

test('pagina principala se incarca si are bara de jos', async ({ page }) => {
  await enter(page);
  await expect(page.locator('#hero')).toBeVisible();
  await expect(page.locator('[data-mobile-nav="bottom"]')).toBeVisible();
});

test('lista de bloguri se incarca si un articol se deschide', async ({ page }) => {
  await enter(page, '/blogs');
  const card = page.locator('a[href^="/blogs/"]:not([href="/blogs/arhiva"]):not([href^="/blogs/serie"])').first();
  await expect(card).toBeVisible();
  await card.click();
  await expect(page).toHaveURL(/\/blogs\/[^/]+$/);
  await expect(page.locator('h1').first()).toBeVisible();
});

test('schimbarea temei merge si ramane aplicata', async ({ page }) => {
  await enter(page);
  const html = page.locator('html');
  const before = (await html.getAttribute('class')) ?? '';
  await page.locator('[data-mobile-nav="bottom"] button').nth(2).click();
  await expect.poll(async () => ((await html.getAttribute('class')) ?? '').includes('light')).toBe(!before.includes('light'));
});

test('schimbarea limbii actualizeaza bara de jos', async ({ page }) => {
  await enter(page);
  await page.locator('[data-mobile-nav="bottom"] .language-dropdown > button').click();
  await page.getByRole('button', { name: 'English' }).click();
  await expect(page.locator('[data-mobile-nav="bottom"]')).toContainText(/Lang|Search/);
});

test('raportarea erorilor primeste un mesaj fara sa cada', async ({ request }) => {
  const res = await request.post('/api/client-error', { data: { message: 'e2e test', url: '/', lang: 'de' } });
  expect([200, 429, 503]).toContain(res.status());
});
