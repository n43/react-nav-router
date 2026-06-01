import { test, expect } from '@playwright/test';

test.describe('history hash 模式', () => {
  test('浏览器后退恢复栈', async ({ page }) => {
    await page.goto('guide/getting-started.html');
    await page.waitForSelector('.react-demo h2');

    await page.getByRole('button', { name: 'Push detail' }).last().click();
    await expect(
      page.locator('.react-demo h2').filter({ hasText: '/detail' }),
    ).toBeVisible();

    await page.goBack();
    await expect(
      page.locator('.react-demo h2').filter({ hasText: '/home' }).last(),
    ).toBeVisible();
  });
});
