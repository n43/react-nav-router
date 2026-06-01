import { test, expect } from '@playwright/test';

test('transition: transform 在 push 中出现，结束后复位', async ({ page }) => {
  await page.goto('guide/getting-started.html');
  await page.waitForSelector('.react-demo h2');

  // 采集动画中间帧 transform
  const samplesPromise = page.evaluate(() => {
    return new Promise<string[]>((resolve) => {
      const samples: string[] = [];
      const start = performance.now();
      const tick = () => {
        document
          .querySelectorAll<HTMLElement>('.react-demo > div > div')
          .forEach((el) => {
            if (el.style.transform) samples.push(el.style.transform);
          });
        if (performance.now() - start < 400) {
          requestAnimationFrame(tick);
        } else {
          resolve(samples);
        }
      };
      requestAnimationFrame(tick);
    });
  });

  await page.getByRole('button', { name: 'Push detail' }).last().click();
  const samples = await samplesPromise;
  expect(samples.some((s) => /translate3d/.test(s))).toBe(true);

  // 等动画彻底结束，断言新页面可见且无 transform
  await expect(
    page.locator('.react-demo h2').filter({ hasText: '/detail' }),
  ).toBeVisible();
  const finalTransforms = await page.$$eval('.react-demo > div > div', (els) =>
    (els as HTMLElement[])
      .filter((el) => el.style.display !== 'none')
      .map((el) => el.style.transform),
  );
  expect(finalTransforms.every((t) => t === '' || t === 'none')).toBe(true);
});
