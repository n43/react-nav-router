import { Page } from '@playwright/test';

/**
 * 等过渡动画结束后的期望文字可见。
 * 不用固定 timeout，直接用 Playwright 的内置重试轮询。
 */
export async function waitForTransition(page: Page) {
  // 确保 React 的 rAF + transition (250ms) + timer 全部走完
  await page.waitForTimeout(600);
}
