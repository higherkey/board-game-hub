import { test, expect } from '@playwright/test';

test('mobile navigation, filters and selected tags expose keyboard state', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 900 });
  await page.route('**/api/games', r => r.abort());
  await page.route('**/health', r => r.fulfill({ json: { status: 'healthy' } }));
  await page.goto('/games');
  const filters = page.getByRole('button', { name: 'Refine Search' });
  await filters.focus(); await page.keyboard.press('Enter');
  await expect(filters).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('#game-filters')).toBeVisible();
  const tag = page.locator('.btn-tag').first();
  await tag.click(); await expect(tag).toHaveAttribute('aria-pressed', 'true');
  const nav = page.getByRole('button', { name: 'Toggle Navigation' });
  await nav.click(); await expect(nav).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Escape');
  await expect(nav).toHaveAttribute('aria-expanded', 'false');
  await expect(nav).toBeFocused();
  await expect(page.getByRole('main')).toHaveCount(1);
  for (const target of [nav, tag, page.getByRole('link', { name: 'Sign Up', exact: true })]) {
    const box = await target.boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(44);
    expect(box!.width).toBeGreaterThanOrEqual(44);
  }
});

test('desktop hides the mobile toggle and keeps the logo keyboard focus visible', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 900 });
  await page.goto('/games');
  await expect(page.getByRole('button', { name: 'Toggle Navigation' })).toBeHidden();
  await page.keyboard.press('Tab');
  const logo = page.getByRole('link', { name: /BoardGameHub.*home/ });
  await logo.focus();
  const outline = await logo.evaluate(el => getComputedStyle(el).outlineStyle);
  expect(outline).not.toBe('none');
});
