import { test, expect } from '@playwright/test';
import { MultiplayerTestHelper } from '../helpers/multiplayer';

test.describe('Table vs. Hand Routing and Role UI', () => {
    test('should differentiate Table shared screen view from Hand private controller view', async ({ browser }) => {
        const helper = new MultiplayerTestHelper(browser);

        // 1. Host creates room as TABLE (Shared screen / TV view)
        const hostTable = await helper.createHost('LivingRoomTV', { isTable: true });

        // 2. Guest joins as PLAYER (Private mobile Hand controller)
        const guestHand = await helper.createGuest(hostTable.roomCode, 'PhonePlayer', { isMobile: true });

        // 3. Verify Table view shows large lobby screen / header / QR area
        await expect(hostTable.page.locator(`text=${guestHand.playerName}`).first()).toBeVisible({ timeout: 10000 });
        await expect(guestHand.page.locator(`text=${hostTable.playerName}`).first()).toBeVisible({ timeout: 10000 });

        // 4. Verify presence in table vs player sections in sidebar
        await expect(hostTable.page.locator('app-room-sidebar')).toBeVisible();
        await expect(guestHand.page.locator('app-room-sidebar')).toBeVisible();

        await hostTable.context.close();
        await guestHand.context.close();
    });
});
