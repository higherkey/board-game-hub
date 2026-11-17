import { test, expect } from '@playwright/test';
import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr';

// Run against a disposable local API with its in-memory database. No browser required.
test('Four in a Row synchronizes two Hands and a read-only Table through a complete match', async () => {
    const url = (process.env['BGH_API_URL'] ?? 'http://127.0.0.1:5109') + '/gamehub';
    const clients = Array.from({ length: 3 }, () => new HubConnectionBuilder().withUrl(url).configureLogging(LogLevel.Error).build());
    const rooms: any[] = [{}, {}, {}];
    function patch(target: any, change: any) {
        for (const [key, value] of Object.entries(change)) {
            if (value && typeof value === 'object' && !Array.isArray(value) && target[key] && !Array.isArray(target[key])) patch(target[key], value);
            else target[key] = value;
        }
    }
    clients.forEach((client, i) => {
        client.on('GameStarted', room => { rooms[i] = room; });
        client.on('RoomStatePatch', change => patch(rooms[i], change));
        for (const event of ['PlayerJoined', 'SessionAssigned', 'TurnCredentials', 'GameTypeChanged']) client.on(event, () => {});
    });
    try {
        await Promise.all(clients.map(client => client.start()));
        const [red, yellow, table] = clients;
        const created = await red.invoke('CreateRoom', 'Red', false, 'FourInARow', null, false);
        const code = created.code;
        await yellow.invoke('JoinRoom', code, 'Yellow', null, false, null);
        await table.invoke('JoinRoom', code, 'Table', null, true, null);
        await red.invoke('ToggleReady', code, null);
        await yellow.invoke('ToggleReady', code, null);
        await red.invoke('StartGame', code, { timerDurationSeconds: 0 });
        await expect.poll(() => rooms.every(room => room.gameData?.playerOrder?.length === 2)).toBe(true);
        expect(rooms[0].gameData.playerOrder).toEqual([red.connectionId, yellow.connectionId]);
        await table.invoke('SubmitAction', code, 'DROP', { column: 0 });
        await yellow.invoke('SubmitAction', code, 'DROP', { column: 0 });
        // A legal move following the rejected actions proves neither consumed the turn.
        const sequence = [0, 6, 1, 6, 2, 5, 3];
        for (let i = 0; i < sequence.length; i++) {
            await clients[i % 2].invoke('SubmitAction', code, 'DROP', { column: sequence[i] });
            await expect.poll(() => rooms.map(room => room.gameData?.moveCount)).toEqual([i + 1, i + 1, i + 1]);
        }
        for (const room of rooms) {
            expect(room.state).toBe('Finished');
            expect(room.gameData.winnerId).toBe(red.connectionId);
            expect(room.gameData.winningCells).toHaveLength(4);
            expect(room.roundScores[red.connectionId!]).toBe(1);
            expect(room.gameData.grid).toEqual(rooms[0].gameData.grid);
        }
        await red.invoke('NextRound', code);
        await expect.poll(() => rooms.every(room => room.gameData?.moveCount === 0 && room.state === 'Playing')).toBe(true);
        await red.invoke('EndGame', code);
        await expect.poll(() => rooms.every(room => room.state === 'Finished')).toBe(true);
        await red.invoke('EndGame', code);
        await expect.poll(() => rooms.every(room => room.state === 'Lobby' && room.gameData === null)).toBe(true);
    } finally {
        await Promise.all(clients.map(client => client.stop()));
    }
});
