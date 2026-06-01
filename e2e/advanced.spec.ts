import { test, expect } from '@playwright/test';

test('同 path 去重 + renderCommon 顶栏持续可见', async ({ page }) => {
  await page.goto('guide/recipes.html');
  await page.waitForSelector('[data-testid="header"]');

  // renderCommon 顶栏
  await expect(page.getByTestId('header')).toBeVisible();

  // 初始 /home
  await expect(
    page.locator('.react-demo h2').filter({ hasText: '/home' }),
  ).toBeVisible();

  // 推入 /a — 用 .last() 确保点到可见页的按钮
  await page.getByRole('button', { name: 'Push /a (dedup)' }).last().click();
  await expect(
    page.locator('.react-demo h2').filter({ hasText: '/a' }),
  ).toBeVisible();

  // 再推 /a → dedup：仍在 /a（.last() 拿可见页的按钮）
  await page.getByRole('button', { name: 'Push /a (dedup)' }).last().click();
  await expect(
    page.locator('.react-demo h2').filter({ hasText: '/a' }),
  ).toBeVisible();

  // 验证 dedup：Back 一次直接回 /home（栈只有 /home + /a 两层）
  await page.getByRole('button', { name: 'Back' }).last().click();
  await expect(
    page.locator('.react-demo h2').filter({ hasText: '/home' }).last(),
  ).toBeVisible();

  // 顶栏始终可见
  await expect(page.getByTestId('header')).toBeVisible();
});
