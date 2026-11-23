import { SIDE_NORMALS, SIDE_VALUES, restingLayout, seedFrom, seededRandom, sideOf } from './dice-math';
import { simulateThrow, upSide } from './dice-physics';

describe('dice math', () => {
    it('puts opposite faces on opposite sides that add up to seven', () => {
        for (let side = 0; side < 6; side += 2) {
            expect(SIDE_VALUES[side] + SIDE_VALUES[side + 1]).toBe(7);
            expect(SIDE_NORMALS[side].map((n, i) => n + SIDE_NORMALS[side + 1][i])).toEqual([0, 0, 0]);
        }
        expect([1, 2, 3, 4, 5, 6].map(sideOf).sort()).toEqual([0, 1, 2, 3, 4, 5]);
        expect(() => sideOf(7)).toThrowError(RangeError);
    });

    it('gives the same random sequence for the same roll id', () => {
        const a = seededRandom(seedFrom('room-ABCD-roll-3'));
        const b = seededRandom(seedFrom('room-ABCD-roll-3'));
        const c = seededRandom(seedFrom('room-ABCD-roll-4'));
        const first = [a(), a(), a()];
        expect([b(), b(), b()]).toEqual(first);
        expect([c(), c(), c()]).not.toEqual(first);
        expect(first.every(n => n >= 0 && n < 1)).toBeTrue();
    });

    it('lays resting dice out centred, in two rows past six', () => {
        const five = restingLayout(5, 16, 9);
        expect(five.length).toBe(5);
        expect(five.reduce((s, p) => s + p.x, 0)).toBeCloseTo(0);
        expect(new Set(five.map(p => p.z)).size).toBe(1);
        const ten = restingLayout(10, 16, 9);
        expect(new Set(ten.map(p => p.z)).size).toBe(2);
    });

    it('reads which side faces up', () => {
        expect(upSide([0, 0, 0, 1])).toEqual({ side: 2, flat: true }); // +y, the 1
        const s = Math.SQRT1_2;
        expect(upSide([s, 0, 0, s]).side).toBe(5); // rolled 90° about x: -z faces up
    });
});

describe('dice physics', () => {
    const rest = (x: number) => ({ p: [x, 0.5, 0] as [number, number, number], q: [0, 0, 0, 1] as [number, number, number, number] });
    const request = (seed: number) => ({
        poses: [rest(-3), rest(-1.5), rest(0), rest(1.5), rest(3)],
        thrown: [true, true, false, true, true],
        trayWidth: 16, trayDepth: 9, seed, motion: 'full' as const
    });

    it('throws the same way for the same seed and lands every thrown die flat', () => {
        const a = simulateThrow(request(42))!;
        const b = simulateThrow(request(42))!;
        expect(a).not.toBeNull();
        expect(a.frames.length).toBe(b.frames.length);
        expect(a.upSides).toEqual(b.upSides);
        expect(a.frames.length).toBeGreaterThan(10);
        a.frames[a.frames.length - 1].forEach((pose, i) => {
            if (i !== 2) expect(upSide(pose.q).flat).toBeTrue();
        });
    });

    it('never moves a held die', () => {
        const result = simulateThrow(request(7))!;
        for (const frame of result.frames) {
            expect(frame[2].p).toEqual([0, 0.5, 0]);
        }
    });
});
