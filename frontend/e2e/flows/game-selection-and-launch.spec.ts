import { test, expect } from '@playwright/test';
import { MultiplayerTestHelper, setReady } from '../helpers/multiplayer';

test.describe('Game Selection and Start', () => {
    test('should allow host to select game and launch gameplay across all players', async ({ browser }) => {
        const helper = new MultiplayerTestHelper(browser);

        // 1. Host creates room and Guest joins
        const host = await helper.createHost('HostAlice');
        const guest = await helper.createGuest(host.roomCode, 'GuestBob');

        // Verify players are synced in lobby
        await expect(host.page.locator(`text=${guest.playerName}`).first()).toBeVisible({ timeout: 10000 });
        await expect(guest.page.locator(`text=${host.playerName}`).first()).toBeVisible({ timeout: 10000 });

        // 2. Host selects Babble game card in lobby
        const babbleCard = host.page.locator('.game-card:has-text("Babble")');
        await expect(babbleCard).toBeVisible({ timeout: 10000 });
        await babbleCard.click();
        await expect(babbleCard).toHaveClass(/selected/);

        // 3. All players ready up, then host clicks START GAME (issue #66)
        await setReady(host.page);
        await setReady(guest.page);
        const startBtn = host.page.locator('button:has-text("START GAME")');
        await expect(startBtn).toBeEnabled({ timeout: 10000 });
        await startBtn.click();

        // 4. Verify game starts for both Host and Guest
        await expect(host.page.locator('.babble-grid')).toBeVisible({ timeout: 15000 });
        await expect(guest.page.locator('.babble-grid')).toBeVisible({ timeout: 15000 });

        await host.context.close();
        await guest.context.close();
    });

    test('should NOT start a new game while players are not ready', async ({ browser }) => {
        const helper = new MultiplayerTestHelper(browser);
        const host = await helper.createHost('HostAlice');
        const guest = await helper.createGuest(host.roomCode, 'GuestBob');
        await expect(host.page.locator(`text=${guest.playerName}`).first()).toBeVisible({ timeout: 10000 });

        const babbleCard = host.page.locator('.game-card:has-text("Babble")');
        await expect(babbleCard).toBeVisible({ timeout: 10000 });
        await babbleCard.click();
        await expect(babbleCard).toHaveClass(/selected/);

        // Nobody is ready: clicking start must not launch the game
        await host.page.locator('button:has-text("START GAME")').click();
        await host.page.waitForTimeout(2000);
        await expect(host.page.locator('.babble-grid')).toHaveCount(0);
        await expect(guest.page.locator('.babble-grid')).toHaveCount(0);
        await expect(babbleCard).toBeVisible();

        await host.context.close();
        await guest.context.close();
    });
});
