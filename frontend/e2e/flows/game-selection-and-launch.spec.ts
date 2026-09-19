import { test, expect } from '@playwright/test';
import { MultiplayerTestHelper } from '../helpers/multiplayer';

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

        // 3. Host clicks START GAME
        const startBtn = host.page.locator('button:has-text("START GAME")');
        await expect(startBtn).toBeEnabled({ timeout: 10000 });
        await startBtn.click();

        // 4. Verify game starts for both Host and Guest
        await expect(host.page.locator('.babble-grid')).toBeVisible({ timeout: 15000 });
        await expect(guest.page.locator('.babble-grid')).toBeVisible({ timeout: 15000 });

        await host.context.close();
        await guest.context.close();
    });
});
