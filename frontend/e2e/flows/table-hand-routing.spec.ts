import { test, expect } from '@playwright/test';
import { MultiplayerTestHelper } from '../helpers/multiplayer';

test.describe('Table vs. Hand Routing and Role UI', () => {
    test('should differentiate Table shared screen view from Hand private controller view', async ({ browser }) => {
        const helper = new MultiplayerTestHelper(browser);

        // 1. Host creates room as TABLE (Shared screen / TV view)
        const hostTable = await helper.createHost('LivingRoomTV', { isTable: true });

        // 2. Guest joins as PLAYER (Private mobile Hand controller)
        const guestHand = await helper.createGuest(hostTable.roomCode, 'PhonePlayer', { isMobile: true });

        // 3. Table (desktop) shows the Hand player in its sidebar
        await expect(hostTable.page.locator('app-room-sidebar').getByText(guestHand.playerName)).toBeVisible({ timeout: 10000 });

        // 4. Hand (mobile) hides the sidebar behind the bottom PLAYERS tab
        await expect(guestHand.page.locator('app-room-sidebar')).toBeHidden();
        await guestHand.page.getByText('PLAYERS', { exact: true }).click();
        await expect(guestHand.page.locator('app-room-sidebar').getByText(hostTable.playerName)).toBeVisible({ timeout: 10000 });

        await hostTable.context.close();
        await guestHand.context.close();
    });
});
