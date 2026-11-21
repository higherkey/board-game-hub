import { FarkleLanding, farkleTrayDice } from './farkle-dice';

describe('FarkleLanding', () => {
    it('shows the result at once on first look (a refresh), then hides each new result until the dice land', () => {
        const landing = new FarkleLanding();
        expect(landing.phase({ phase: 'Farkled', rollId: 4 })).toBe('Farkled');

        expect(landing.phase({ phase: 'Farkled', rollId: 5 })).toBe('Rolling');
        landing.land(5);
        expect(landing.phase({ phase: 'Farkled', rollId: 5 })).toBe('Farkled');
        expect(landing.phase({ phase: 'Picking', rollId: 5 })).toBe('Picking');
    });
});

describe('farkleTrayDice', () => {
    it('only builds new tray dice when the server sends new dice', () => {
        const toTray = farkleTrayDice();
        const dice = [{ value: 2, isHeld: false, isReserved: false }];
        const first = toTray(dice);
        expect(toTray(dice)).toBe(first);
        expect(toTray([...dice])).not.toBe(first);
        expect(toTray(undefined)).toEqual([]);
    });
});
