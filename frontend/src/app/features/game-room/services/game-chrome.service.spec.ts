import { TemplateRef } from '@angular/core';
import { createMockRoom } from '../../../shared/testing/test-helpers';
import { GameChromeService, playersAsEntries } from './game-chrome.service';

describe('GameChromeService', () => {
    let chrome: GameChromeService;
    beforeEach(() => chrome = new GameChromeService());

    it('publishes only the keys it is given', () => {
        chrome.publish({ progress: 'Turn 1 of 13' });
        chrome.publish({ status: 'Your turn' });
        expect(chrome.status()).toBe('Your turn');
        expect(chrome.progress()).toBe('Turn 1 of 13');
    });

    it('remembers whether the game itself has ended', () => {
        chrome.publish({ status: 'Ann wins', ended: true });
        expect(chrome.ended()).toBeTrue();
        chrome.publish({ status: 'Bo’s turn' });
        expect(chrome.ended()).toBeTrue();
        chrome.publish({ ended: false });
        expect(chrome.ended()).toBeFalse();
    });

    it('resets status, progress, rules, scores and the end flag', () => {
        chrome.publish({ status: 'A', progress: 'B', scores: [{ id: '1', name: 'X', score: 1 }], ended: true });
        chrome.rules.set({} as TemplateRef<unknown>);
        chrome.reset();
        expect(chrome.status()).toBe('');
        expect(chrome.progress()).toBe('');
        expect(chrome.rules()).toBeNull();
        expect(chrome.scores()).toBeNull();
        expect(chrome.ended()).toBeFalse();
    });
});

describe('playersAsEntries', () => {
    it('lists Hand players with their scores, marking the active player and me', () => {
        const room = createMockRoom({
            players: [
                { connectionId: 'tv', name: 'TV', score: 0, isHost: true, isReady: true, isScreen: true },
                { connectionId: 'a', name: 'Ann', score: 12, isHost: false, isReady: true, isScreen: false },
                { connectionId: 'b', name: 'Bo', score: 7, isHost: false, isReady: true, isScreen: false }
            ]
        });
        expect(playersAsEntries(room, 'b', 'a')).toEqual([
            { id: 'a', name: 'Ann', score: 12, active: false, isMe: true },
            { id: 'b', name: 'Bo', score: 7, active: true, isMe: false }
        ]);
    });
});
