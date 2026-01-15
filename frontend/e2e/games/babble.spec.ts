import { test, expect } from '@playwright/test';
import { MultiplayerTestHelper } from '../helpers/multiplayer';

test.describe('Babble Multiplayer', () => {
    test('should synchronize the game grid between Host and Guest', async ({ browser }) => {
        const helper = new MultiplayerTestHelper(browser);

        // 1. Host creates a room
        const { page: hostPage, roomCode } = await helper.createHost('HostAlice');

        // 2. Guest joins the room
        const { page: guestPage } = await helper.createGuest(roomCode, 'GuestBob');

        // 3. Verify both players are in the lobby
        await expect(hostPage.locator('text=HostAlice')).toBeVisible();
        await expect(hostPage.locator('text=GuestBob')).toBeVisible();
        await expect(guestPage.locator('text=HostAlice')).toBeVisible();
        await expect(guestPage.locator('text=GuestBob')).toBeVisible();

        // 4. Host selects Babble (if not already selected)
        // Find the Babble card in the grid
        const babbleCard = hostPage.locator('.game-card:has-text("Babble")');
        await babbleCard.click();
        await expect(babbleCard).toHaveClass(/selected/);

        // 5. Host starts the game
        const startButton = hostPage.locator('button:has-text("START GAME")');
        await expect(startButton).toBeEnabled();
        await startButton.click();

        // 6. Verify game starts for both
        await expect(hostPage.locator('.babble-grid')).toBeVisible();
        await expect(guestPage.locator('.babble-grid')).toBeVisible();

        // 7. Verify the grid content is synchronized (First 4 letters)
        const hostLetters = await hostPage.locator('.letter-tile').allInnerTexts();
        const guestLetters = await guestPage.locator('.letter-tile').allInnerTexts();

        expect(hostLetters).toEqual(guestLetters);
        expect(hostLetters.length).toBe(16); // Standard 4x4 grid
    });
});
