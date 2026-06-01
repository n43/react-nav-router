import { test, expect } from '@playwright/test';

test('push then back - active page changes', async ({ page }) => {
  await page.goto('guide/getting-started.html');
  await page.waitForSelector('.react-demo h2');

  // 初始：/home 页可见
  await expect(
    page.locator('.react-demo h2').filter({ hasText: '/home' }),
  ).toBeVisible();

  // push /detail
  await page.getByRole('button', { name: 'Push detail' }).last().click();
  await expect(
    page.locator('.react-demo h2').filter({ hasText: '/detail' }),
  ).toBeVisible();

  // back → /home
  await page.getByRole('button', { name: 'Back' }).last().click();
  await expect(
    page.locator('.react-demo h2').filter({ hasText: '/home' }).last(),
  ).toBeVisible();
});
