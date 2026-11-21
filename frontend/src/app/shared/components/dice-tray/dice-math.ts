/**
 * Pure helpers for the dice tray: face layout, pips, seeded randomness and resting layout.
 * Nothing here touches three.js or the physics engine, so it loads with the page and is easy to test.
 */

/** A die as a game hands it to the tray. The server decides `value`; the tray only shows it. */
export interface TrayDie {
    /** 1 to 6. */
    value: number;
    /** Kept out of the throw: it stays where it is and thrown dice bounce off it. Marked in navy. */
    held?: boolean;
    /** The player's pick (to keep, score, reroll). Marked in pink and read out as pressed. */
    selected?: boolean;
    /** Cannot be tapped, such as dice already banked. */
    locked?: boolean;
    /** Body colour for this die, overriding the tray's. */
    color?: string;
}

/** How much a throw moves: the whole tumble, a quick one for small screens, or none at all. */
export type DiceMotion = 'full' | 'short' | 'none';

/**
 * Value on each side of the die, in three.js BoxGeometry material order: +x, -x, +y, -y, +z, -z.
 * Opposite sides add up to 7, as on a real die.
 */
export const SIDE_VALUES = [3, 4, 1, 6, 2, 5] as const;

/** Outward normal of each side, in the same order as SIDE_VALUES. */
export const SIDE_NORMALS: readonly (readonly [number, number, number])[] = [
    [1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]
];

/** The side (index into SIDE_VALUES) that shows a value. */
export function sideOf(value: number): number {
    const side = SIDE_VALUES.indexOf(value as (typeof SIDE_VALUES)[number]);
    if (side < 0) throw new RangeError(`A six-sided die has no ${value}`);
    return side;
}

/** Pip centres for each value on a unit face (0 to 1). */
export const PIPS: Record<number, readonly (readonly [number, number])[]> = {
    1: [[0.5, 0.5]],
    2: [[0.27, 0.27], [0.73, 0.73]],
    3: [[0.27, 0.27], [0.5, 0.5], [0.73, 0.73]],
    4: [[0.27, 0.27], [0.73, 0.27], [0.27, 0.73], [0.73, 0.73]],
    5: [[0.27, 0.27], [0.73, 0.27], [0.5, 0.5], [0.27, 0.73], [0.73, 0.73]],
    6: [[0.27, 0.25], [0.73, 0.25], [0.27, 0.5], [0.73, 0.5], [0.27, 0.75], [0.73, 0.75]]
};

/** Turns any roll id (number or text) into a 32-bit seed. */
export function seedFrom(key: string | number): number {
    let h = 2166136261;
    for (const ch of String(key)) {
        h ^= ch.codePointAt(0) ?? 0;
        h = Math.imul(h, 16777619);
    }
    return h >>> 0;
}

/**
 * Small seeded random source (mulberry32). The same roll id gives the same throw on every screen,
 * so trays of the same size, starting from the same places, show the same tumble.
 */
export function seededRandom(seed: number): () => number {
    let a = seed >>> 0;
    return () => {
        a = (a + 0x6d2b79f5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/** Resting places for dice that are not being thrown: an even row (two rows past six), centred in the tray. */
export function restingLayout(count: number, trayWidth: number, trayDepth: number): { x: number; z: number }[] {
    const perRow = count > 6 ? Math.ceil(count / 2) : count;
    const rows = Math.ceil(count / Math.max(perRow, 1));
    const gapX = Math.min(1.6, (trayWidth - 2) / Math.max(perRow, 1));
    const gapZ = Math.min(1.8, (trayDepth - 2) / Math.max(rows, 1));
    return Array.from({ length: count }, (_, i) => {
        const row = Math.floor(i / perRow);
        const inRow = Math.min(perRow, count - row * perRow);
        const col = i - row * perRow;
        return {
            x: (col - (inRow - 1) / 2) * gapX,
            z: (row - (rows - 1) / 2) * gapZ
        };
    });
}

/** True when the visitor asked their system for less motion. */
export function prefersReducedMotion(): boolean {
    return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Whether this browser can draw the 3D tray. */
export function canUseWebGl(): boolean {
    try {
        const canvas = document.createElement('canvas');
        return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'));
    } catch {
        return false;
    }
}
