import { test, expect, Page } from '@playwright/test';
import { MultiplayerTestHelper, PlayerSession, selectGame, setReady } from '../helpers/multiplayer';

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

// These browser tests use the existing Angular development server. The debug hook only
// reads received state / invokes the real browser SignalR connection; nothing is mocked.
async function receivedRoom(page: Page) {
    return page.evaluate(() => {
        const component = (window as any).ng.getComponent(document.querySelector('app-game-room'));
        return component.stateService.signalRService.currentRoomSubject.value;
    });
}

async function invokeRoom(page: Page, method: string, ...args: unknown[]) {
    return page.evaluate(async ({ method, args }) => {
        const component = (window as any).ng.getComponent(document.querySelector('app-game-room'));
        const service = component.stateService.signalRService;
        return service.hubConnection.invoke(method, service.currentRoomSubject.value.code, ...args);
    }, { method, args });
}

for (const hostIsTable of [true, false]) {
    test(`synchronizes round results, replay and lobby with a ${hostIsTable ? 'Table' : 'Hand'} host`, async ({ browser }) => {
        test.setTimeout(90_000);
        const helper = new MultiplayerTestHelper(browser);
        const sessions: PlayerSession[] = [];
        try {
            const host = await helper.createHost('LifecycleHost', { isTable: hostIsTable });
            sessions.push(host);
            const hand = await helper.createGuest(host.roomCode, 'LifecycleHand');
            sessions.push(hand);
            const other = await helper.createGuest(host.roomCode, hostIsTable ? 'SecondHand' : 'GuestTable', { isTable: !hostIsTable });
            sessions.push(other);

            async function synchronized(state: string, resultPhase: string | null, roundNumber: number) {
                await expect.poll(async () => Promise.all(sessions.map(async session => {
                    const room = await receivedRoom(session.page);
                    return [room.state, room.resultPhase, room.roundNumber];
                }))).toEqual(sessions.map(() => [state, resultPhase, roundNumber]));
            }

            await expect.poll(async () => (await receivedRoom(host.page)).players.length).toBe(3);
            await selectGame(host.page, 'Scatterbrain');
            await host.page.locator('#totalRounds').fill('2');
            await host.page.locator('#timerDuration').fill('600');
            await setReady(host.page);
            await setReady(hand.page);
            if (hostIsTable) await setReady(other.page);
            await host.page.getByRole('button', { name: /START GAME/i }).click();
            await synchronized('Playing', null, 1);

            const table = hostIsTable ? host : other;
            const hands = hostIsTable ? [hand, other] : [host, hand];
            await expect(table.page.locator('app-scatterbrain')).toBeVisible();
            for (const player of hands) {
                await expect(player.page.locator('app-scatterbrain-hand')).toBeVisible();
            }
            // A phase-inappropriate host call must not consume a round or reset gameplay.
            await invokeRoom(host.page, 'NextRound');
            await synchronized('Playing', null, 1);

            // Unique answers guarantee a nonzero score, so replay must actually reset it.
            const firstRoom = await receivedRoom(hand.page);
            await invokeRoom(hand.page, 'SubmitAction', 'SUBMIT_ANSWER', [`${firstRoom.gameData.currentLetter}answer`]);
            await expect.poll(async () => {
                const room = await receivedRoom(host.page);
                return Object.values(room.playerAnswers).some((answers: any) => answers[0]?.endsWith('answer'));
            }).toBe(true);
            await invokeRoom(host.page, 'EndRound');
            await synchronized('Finished', 'RoundResults', 1);
            await expect.poll(async () => (await receivedRoom(host.page)).players.some((player: any) => player.score > 0)).toBe(true);
            for (const guest of [hand, other]) {
                await expect(guest.page.getByRole('button', { name: /next round|play again/i })).toHaveCount(0);
            }
            await host.page.getByRole('button', { name: /next round/i }).filter({ visible: true }).first().click();
            await synchronized('Playing', null, 2);
            await invokeRoom(host.page, 'EndRound');
            await synchronized('Finished', 'GameOver', 2);
            await expect(host.page.getByRole('button', { name: /next round/i })).toHaveCount(0);
            await expect(host.page.getByRole('button', { name: /play again/i }).filter({ visible: true }).first()).toBeVisible();

            await expect(invokeRoom(hand.page, 'PlayAgain')).rejects.toThrow(/authorized host/i);
            await invokeRoom(host.page, 'NextRound');
            await synchronized('Finished', 'GameOver', 2);
            await host.page.getByRole('button', { name: /play again/i }).filter({ visible: true }).first().click();
            await synchronized('Playing', null, 1);
            for (const session of sessions) {
                const room = await receivedRoom(session.page);
                expect(room.gameType).toBe('Scatterbrain');
                expect(room.players.every((player: any) => player.score === 0)).toBe(true);
                expect(Object.values(room.roundScores).every(score => score == null || score === 0)).toBe(true);
                expect(Object.values(room.playerAnswers).every(answers => answers == null)).toBe(true);
            }

            // Explicit early finish must show final results even before the round limit.
            await invokeRoom(host.page, 'EndGame');
            await synchronized('Finished', 'GameOver', 1);
            await expect(host.page.getByRole('button', { name: /next round/i })).toHaveCount(0);
            host.page.once('dialog', dialog => dialog.accept());
            await host.page.getByRole('button', { name: /end session/i }).filter({ visible: true }).first().click();
            await synchronized('Lobby', null, 0);
            for (const session of sessions) {
                const room = await receivedRoom(session.page);
                expect(room.gameType).toBe('None');
                expect(room.gameData).toBeNull();
                await expect(session.page.locator('app-scatterbrain, app-scatterbrain-hand')).toHaveCount(0);
                await expect(session.page.locator('app-room-sidebar').getByText('LifecycleHand', { exact: true })).toBeVisible();
            }
            await expect(host.page.locator('#full-game-input')).toBeVisible();
        } finally {
            await Promise.allSettled(sessions.map(session => session.context.close()));
        }
    });
}
