import { expect, test } from '@playwright/test';

// Presentation checks use an HTTP boundary fixture; multiplayer behavior has its own suite.
const games = [{
  id: 'four-in-a-row', name: 'Four in a Row', icon: '', description: 'Connect four.',
  status: 'Deployed', minPlayers: 2, maxPlayers: 2, complexity: 1,
  averagePlayTime: 10, tags: 'Strategy', timerType: 0, defaultRoundLengthSeconds: 0
}];

test.beforeEach(async ({ page }) => {
  await page.route('**/api/games', route => route.fulfill({ json: games }));
  await page.route('**/health', route => route.fulfill({ json: { status: 'Healthy' } }));
});

for (const width of [360, 768, 1024, 1440]) {
  test(`Home preserves its content and room entry at ${width}px`, async ({ page }, testInfo) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/');
    const hero = page.locator('app-home-hero');
    await expect(hero).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    await expect(hero.locator('.dc-caption-title')).toHaveText(['Host', 'Join', 'Play']);
    await expect(page.locator('.dc-concept-flag, .unified-showcase-stage')).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'How Table vs. Hand Works' })).toBeVisible();
    const featured = page.getByRole('link', { name: /Four in a Row/ });
    await featured.scrollIntoViewIfNeeded();
    await expect(featured).toBeInViewport();
    const explanation = page.getByRole('heading', { name: 'How Table vs. Hand Works' });
    await explanation.scrollIntoViewIfNeeded();
    await expect(explanation).toBeInViewport();
    await page.screenshot({ path: testInfo.outputPath('home-details-' + width + '.png') });
    await hero.scrollIntoViewIfNeeded();

    const pause = hero.getByRole('button', { name: 'Pause animation' });
    await pause.click();
    await expect(hero.getByRole('button', { name: 'Play animation' })).toHaveAttribute('aria-pressed', 'true');
    const play = hero.locator('.dc-caption').filter({ hasText: 'Your phone is your hand' });
    await play.focus();
    await page.keyboard.press('Enter');
    await expect(play).toHaveAttribute('aria-current', 'step');
    await expect.poll(() => hero.locator('[data-progress="join"]').evaluate(el =>
      new DOMMatrix(getComputedStyle(el).transform).a)).toBeGreaterThanOrEqual(0.999);
    await expect(hero.locator('.dc-room-game')).toContainText('Card game');
    if (width >= 1024) {
      const lines = await hero.locator('.dc-progress').evaluateAll(elements => elements.map(el => el.getBoundingClientRect().top));
      expect(Math.max(...lines) - Math.min(...lines)).toBeLessThanOrEqual(1);
    }

    await hero.screenshot({ path: testInfo.outputPath('home-' + width + '.png') });
    const toggle = hero.getByRole('button', { name: 'Enter room code directly' });
    await toggle.click();
    const input = hero.getByRole('textbox', { name: '4-letter room code' });
    await expect(input).toBeFocused();
    await input.fill('AB');
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
    const box = await input.boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(width);
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/play$/);
    expect(errors).toEqual([]);
  });
}

test('Home plays the polished Host sequence and deals cards from Hand to Table', async ({ page }) => {
  await page.goto('/');
  const hero = page.locator('app-home-hero');
  const chosen = hero.locator('.dc-pick--chosen');
  await expect(chosen).toHaveCount(1);
  await expect(chosen.locator('i')).toHaveClass(/bi-suit-spade-fill/);
  await expect(hero.locator('.dc-scene--host .dc-cursor')).toBeVisible();
  await expect(hero.locator('.dc-roomcard')).toHaveCSS('opacity', '1', { timeout: 12000 });
  await hero.locator('.dc-caption').filter({ hasText: 'Your phone is your hand' }).click();
  // Observe the moving card between devices, where phone overflow used to clip it.
  await expect.poll(() => hero.locator('.dc-hand--a .dc-card--chosen').evaluate(card => {
    const bounds = card.getBoundingClientRect();
    const phone = card.closest('.dc-phone')!.getBoundingClientRect();
    const x = bounds.x + bounds.width / 2;
    const y = bounds.y + bounds.height / 2;
    return y < phone.top && document.elementFromPoint(x, y) === card;
  }), { intervals: [16], timeout: 7000 }).toBe(true);
  await expect(hero.locator('.dc-slot--a .dc-placed')).toHaveCSS('opacity', '1', { timeout: 7000 });
  await expect(hero.locator('.dc-slot--b .dc-placed')).toHaveCSS('opacity', '1', { timeout: 7000 });
});

test('reduced motion presents the finished story without animation controls', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const hero = page.locator('app-home-hero');
  await expect(hero.locator('.dc-hero')).toHaveClass(/dc-static/);
  await expect(hero.locator('.dc-pause')).toHaveCount(0);
  for (const caption of await hero.locator('.dc-caption').all()) await expect(caption).toBeDisabled();
  await expect(hero.locator('.dc-roomcard')).toHaveCSS('opacity', '1');
  await expect(hero.locator('.dc-slot--a .dc-placed')).toHaveCSS('opacity', '1');
  await expect(hero.locator('.join-cap-btn')).toHaveCSS('animation-name', 'none');
});

test('the concept route reuses the hero and keeps its navigation links', async ({ page }) => {
  await page.goto('/design-concept');
  const hero = page.locator('app-home-hero');
  await expect(hero).toBeVisible();
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  await expect(page.locator('.dc-concept-flag')).toBeVisible();
  await expect(hero.getByRole('link', { name: 'Choose a Game' })).toHaveAttribute('href', '/games');
  await expect(hero.getByRole('link', { name: 'Join a Room' })).toHaveAttribute('href', '/play');
  await page.goto('/design-consent');
  await expect(page).toHaveURL(/\/design-concept$/);
  await expect(hero).toBeVisible();
});


test('changing reduced motion stops and restores the live animation', async ({ page }) => {
  await page.goto('/');
  const hero = page.locator('app-home-hero');
  await expect(hero.getByRole('button', { name: 'Pause animation' })).toBeVisible();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(hero.locator('.dc-hero')).toHaveClass(/dc-static/);
  await expect(hero.locator('.dc-pause')).toHaveCount(0);
  await expect(hero.locator('.dc-roomcard')).toHaveCSS('opacity', '1');
  await expect(hero.locator('.dc-slot--a .dc-placed')).toHaveCSS('opacity', '1');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(hero.locator('.dc-hero')).not.toHaveClass(/dc-static/);
  await expect(hero.getByRole('button', { name: 'Pause animation' })).toBeVisible();
});
