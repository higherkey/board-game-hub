import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  // Keep external services out of these browsing tests.
  await page.route('**/api/**', route => route.abort());
  await page.route('**/health', route => route.fulfill({ json: { status: 'healthy' } }));
  await page.route('**/gamehub/**', route => route.abort());
});

for (const width of [360, 1280]) {
  test(`first visit shows games before the API responds at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    let release!: () => void;
    const gate = new Promise<void>(resolve => release = resolve);
    let requests = 0;
    await page.route('**/api/games', async route => {
      requests++;
      await gate;
      await route.fulfill({ status: 503, json: { error: 'unavailable' } });
    });
    try {
      await page.goto('/games');
      await expect(page.locator('.game-card').first()).toBeVisible();
      await expect(page.locator('.game-card').filter({ hasText: 'Yacht' })).toBeVisible();
      await expect(page.getByText('Loading games...', { exact: true })).toHaveCount(0);
      await expect.poll(() => requests).toBe(1);
    } finally { release(); }
  });
}

test('offline first visit retains the bundled catalogue', async ({ page }) => {
  await page.route('**/api/games', route => route.abort('internetdisconnected'));
  await page.goto('/games');
  await expect(page.locator('.game-card').filter({ hasText: 'Yacht' })).toBeVisible();
  await expect(page.getByText('Loading games...', { exact: true })).toHaveCount(0);
});

test('Home shows featured games before the API responds', async ({ page }) => {
  let release!: () => void;
  const gate = new Promise<void>(resolve => release = resolve);
  await page.route('**/api/games', async route => {
    await gate;
    await route.fulfill({ status: 503, json: { error: 'unavailable' } });
  });
  try {
    await page.goto('/');
    await expect(page.locator('.preview-card')).toHaveCount(3);
    await expect(page.locator('.preview-name').first()).not.toBeEmpty();
  } finally { release(); }
});

test('refresh updates cards and survives an offline reload without duplicate requests', async ({ page }) => {
  let requests = 0;
  await page.route('**/api/games', async route => {
    requests++;
    await route.fulfill({ json: [{ id: 'Yacht', name: 'Fresh catalogue game', icon: '🎲',
      description: 'Updated metadata', status: 'Testing', minPlayers: 1, maxPlayers: 8,
      complexity: 1, averagePlayTime: 15, tags: 'Dice', timerType: 'NotApplicable',
      defaultRoundLengthSeconds: 0, settingsMetadataJson: null }] });
  });
  await page.goto('/games');
  await expect(page.locator('.game-card')).toHaveCount(1);
  await expect(page.locator('.game-card')).toContainText('Fresh catalogue game');
  expect(requests).toBe(1);
  await page.route('**/api/games', route => route.abort('internetdisconnected'));
  await page.reload();
  await expect(page.locator('.game-card')).toHaveCount(1);
  await expect(page.locator('.game-card')).toContainText('Fresh catalogue game');
});

test('an invalid refresh cannot replace the bundled catalogue', async ({ page }) => {
  await page.route('**/api/games', route => route.fulfill({ json: [] }));
  await page.goto('/games');
  await expect(page.locator('.game-card').filter({ hasText: 'Yacht' })).toBeVisible();
});
