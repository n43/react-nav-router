import { test, expect } from '@playwright/test';

test('lifecycle 钩子计数随 push 递增', async ({ page }) => {
  await page.goto('guide/testing.html');
  await page.waitForSelector('[data-testid="counters-/home"]');

  // /home 初始可见，willAppear + didAppear 已触发
  const homeEl = page.locator('[data-testid="counters-/home"]');
  await expect(homeEl).toContainText('"willAppear": 1');
  await expect(homeEl).toContainText('"didAppear": 1');

  // push → detail 出现
  await page.getByRole('button', { name: 'Push' }).last().click();

  // 等 detail 页可见（h2 标题出现）
  await expect(
    page.locator('.react-demo h2').filter({ hasText: '/detail' }),
  ).toBeVisible();

  // detail 的 willAppear + didAppear 应已触发（可能 ≥ 1）
  const detailEl = page.locator('[data-testid^="counters-/detail"]');
  await expect(detailEl).toContainText('"didAppear": 1');

  // /home 的 willDisappear 应已触发（动画开始时）
  await expect(homeEl).toContainText('"willDisappear": 1');
});
