import { DiceScene } from './dice-scene';
import { TrayDie, canUseWebGl } from './dice-math';

/** Draws real dice, so it needs WebGL; the flat fallback is covered in dice-tray.component.spec. */
describe('DiceScene', () => {
    const look = { dieColor: '#ffffff', pipColor: '#00285c', onePipColor: '#e8179b' };
    let host: HTMLElement;
    let scene: DiceScene | null = null;
    const dice: TrayDie[] = [{ value: 1 }, { value: 4, held: true }, { value: 6 }, { value: 2, selected: true }, { value: 5 }];

    beforeEach(() => {
        if (!canUseWebGl()) pending('No WebGL in this browser');
        host = document.createElement('div');
        host.style.cssText = 'width: 480px; height: 360px';
        document.body.appendChild(host);
        scene = new DiceScene(host, 4 / 3, look, 9);
    });

    afterEach(() => {
        scene?.dispose();
        host?.remove();
    });

    const settle = (fn: (done: () => void) => void) => new Promise<number>(resolve => {
        let calls = 0;
        fn(() => { calls++; setTimeout(() => resolve(calls), 50); });
    });

    it('shows dice at rest with one tap position each, inside the tray', () => {
        scene!.show(dice);
        const spots = scene!.hotspots(dice.length);
        expect(spots.length).toBe(5);
        for (const s of spots) {
            expect(s.x).toBeGreaterThan(0);
            expect(s.x).toBeLessThan(1);
            expect(s.y).toBeGreaterThan(0);
            expect(s.y).toBeLessThan(1);
            expect(s.size).toBeGreaterThan(0);
        }
        expect(scene!.isRolling).toBeFalse();
    });

    it('drops an unfinished throw when a new one starts, and finishes the new one once', async () => {
        scene!.show(dice);
        let firstDone = 0;
        scene!.throw(dice, 1, 'short', () => firstDone++);
        expect(scene!.isRolling).toBeTrue();
        const calls = await settle(done => scene!.throw(dice, 2, 'short', done));
        expect(calls).toBe(1);
        expect(firstDone).toBe(0);
        expect(scene!.isRolling).toBeFalse();
    }, 20000);

    it('gathers settled dice into a row with no overlapping tap targets', async () => {
        scene!.show(dice);
        await settle(done => scene!.throw(dice, 3, 'short', done));
        await settle(done => scene!.gather(dice.length, done));
        const spots = scene!.hotspots(dice.length);
        const ys = spots.map(s => s.y);
        expect(Math.max(...ys) - Math.min(...ys)).toBeLessThan(0.05);
        const xs = spots.map(s => s.x).sort((a, b) => a - b);
        for (let i = 1; i < xs.length; i++) expect(xs[i] - xs[i - 1]).toBeGreaterThan(spots[0].size * (360 / 480) * 0.9);
    }, 20000);
});
