import { test, expect } from '@playwright/test';

test('mobile navigation, filters and selected tags expose keyboard state', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 900 });
  await page.route('**/api/games', r => r.abort());
  await page.route('**/health', r => r.fulfill({ json: { status: 'healthy' } }));
  await page.goto('/games');
  await expect(page.getByRole('search', { name: 'Search the shelf' })).toBeVisible();
  const filters = page.getByRole('button', { name: 'Filters' });
  await filters.click();
  await expect(filters).toHaveAttribute('aria-expanded', 'true');
  const tag = page.getByRole('button', { name: '4 players', exact: true });
  await tag.focus(); await page.keyboard.press('Enter');
  await expect(tag).toHaveAttribute('aria-pressed', 'true');
  const nav = page.getByRole('button', { name: 'Toggle Navigation' });
  await nav.click(); await expect(nav).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Escape');
  await expect(nav).toHaveAttribute('aria-expanded', 'false');
  await expect(nav).toBeFocused();
  await expect(page.getByRole('main')).toHaveCount(1);
  for (const target of [nav, tag, page.getByRole('link', { name: 'Sign Up', exact: true })]) {
    const box = await target.boundingBox();
    // Chromium can report a 44px target as 43.999996px after transforms.
    expect(Math.round(box!.height * 1000) / 1000).toBeGreaterThanOrEqual(44);
    expect(Math.round(box!.width * 1000) / 1000).toBeGreaterThanOrEqual(44);
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
