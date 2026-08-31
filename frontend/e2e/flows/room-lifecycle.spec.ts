import { test, expect } from '@playwright/test';
import { MultiplayerTestHelper } from '../helpers/multiplayer';

test.describe('Room Lifecycle & Real-Time Sync', () => {
    test('should allow host to create room and guest to join with synchronized lobby presence', async ({ browser }) => {
        const helper = new MultiplayerTestHelper(browser);

        // 1. Host creates a room
        const host = await helper.createHost('HostCommander');
        expect(host.roomCode).toMatch(/^[A-Z0-9]{4}$/);

        // Verify host sees their name in the room
        await expect(host.page.locator(`text=${host.playerName}`).first()).toBeVisible();

        // 2. Guest joins room with roomCode
        const guest = await helper.createGuest(host.roomCode, 'GuestPlayerOne');

        // 3. Verify real-time presence synchronized via SignalR
        // Host should see Guest in sidebar/players list
        await expect(host.page.locator(`text=${guest.playerName}`).first()).toBeVisible({ timeout: 10000 });
        // Guest should see Host and themselves in sidebar/players list
        await expect(guest.page.locator(`text=${host.playerName}`).first()).toBeVisible({ timeout: 10000 });
        await expect(guest.page.locator(`text=${guest.playerName}`).first()).toBeVisible({ timeout: 10000 });

        // Clean up contexts
        await host.context.close();
        await guest.context.close();
    });
});
