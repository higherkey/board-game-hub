import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { GameDefinition } from '../../../services/game-data.service';

/** Fill roles: d = game colour, b and c = accents, w = white, n = navy, p = pink. */
type Fill = 'd' | 'b' | 'c' | 'w' | 'n' | 'p' | 'none';

export type BoxShape =
    | { kind: 'poly'; pts: string; f: Fill }
    | { kind: 'circle'; cx: number; cy: number; r: number; f: Fill; stroke?: Fill }
    | { kind: 'text'; x: number; y: number; t: string; f: Fill };

interface BoxArt { theme: number; shapes: BoxShape[]; turn?: number }

const PIPS: Record<number, [number, number][]> = {
    1: [[0.5, 0.5]],
    2: [[0.27, 0.27], [0.73, 0.73]],
    3: [[0.27, 0.27], [0.5, 0.5], [0.73, 0.73]],
    5: [[0.27, 0.27], [0.73, 0.27], [0.5, 0.5], [0.27, 0.73], [0.73, 0.73]]
};

const square = (x: number, y: number, s: number) => `${x},${y} ${x + s},${y} ${x + s},${y + s} ${x},${y + s}`;
const poly = (pts: string, f: Fill): BoxShape => ({ kind: 'poly', pts, f });
const circle = (cx: number, cy: number, r: number, f: Fill, stroke?: Fill): BoxShape => ({ kind: 'circle', cx, cy, r, f, stroke });

function dice(list: [number, number, number, number, Fill][]): BoxShape[] {
    return list.flatMap(([x, y, s, v, f]) => [
        poly(square(x, y, s), f),
        ...PIPS[v].map(([u, q]) => circle(x + u * s, y + q * s, s * 0.09, 'w'))
    ]);
}

function babble(): BoxShape[] {
    const shapes: BoxShape[] = [poly('0,0 100,0 100,100 0,100', 'd')];
    'BABLESORTWINGAME'.split('').forEach((t, i) => {
        const x = 4 + (i % 4) * 24, y = 4 + Math.floor(i / 4) * 24, hot = i >= 12;
        shapes.push(poly(square(x, y, 20), hot ? 'n' : 'w'));
        shapes.push({ kind: 'text', x: x + 10, y: y + 11, t, f: hot ? 'w' : 'n' });
    });
    return shapes;
}

/** Hand-drawn covers. Every other game gets a tangram square in its own colour. */
const COVERS: Record<string, BoxArt> = {
    Farkle: { theme: 0, shapes: dice([[4, 6, 28, 5, 'd'], [68, 6, 28, 1, 'p'], [36, 36, 28, 3, 'b'], [4, 66, 28, 2, 'b'], [68, 66, 28, 5, 'd']]) },
    Yacht: {
        theme: 1, shapes: [
            poly('48,6 48,62 10,62', 'd'), poly('53,20 53,62 88,62', 'b'), poly('48,2 48,10 60,6', 'p'),
            poly('4,68 96,68 82,86 18,86', 'n'), poly('10,92 42,92 48,98 16,98', 'b'), poly('56,92 84,92 90,98 62,98', 'b'),
            circle(42, 22, 4.5, 'w'), circle(34, 38, 4.5, 'w'), circle(26, 54, 4.5, 'w'), circle(62, 48, 4, 'w'), circle(72, 56, 4, 'w'),
            circle(30, 77, 4, 'w'), circle(50, 77, 4, 'w'), circle(70, 77, 4, 'w')
        ]
    },
    Babble: { theme: 2, shapes: babble() },
    CloverMinded: {
        theme: 3, shapes: [
            poly('50,4 68,22 50,40 32,22', 'd'), poly('72,26 90,44 72,62 54,44', 'b'), poly('50,48 68,66 50,84 32,66', 'd'),
            poly('28,26 46,44 28,62 10,44', 'b'), poly('54,86 64,86 80,100 70,100', 'c')
        ]
    },
    FourInARow: {
        theme: 4, shapes: [
            poly('8,32 92,32 92,98 8,98', 'd'), poly('52,20 64,20 58,27', 'd'), circle(58, 10, 8, 'b'),
            ...([[23, 49, 'w'], [42, 49, 'w'], [61, 49, 'w'], [80, 49, 'b'], [23, 65, 'w'], [42, 65, 'c'], [61, 65, 'b'], [80, 65, 'c'],
            [23, 81, 'b'], [42, 81, 'b'], [61, 81, 'c'], [80, 81, 'c']] as [number, number, Fill][]).map(([x, y, f]) => circle(x, y, 7, f))
        ]
    },
    Warships: {
        theme: 5, shapes: [
            poly('4,64 96,64 84,80 16,80', 'd'), poly('34,42 56,42 56,64 34,64', 'n'), poly('56,64 56,48 72,64', 'n'),
            poly('14,56 30,56 30,64 8,64', 'n'), poly('12,88 46,88 52,94 18,94', 'b'), poly('60,88 80,88 86,94 66,94', 'b'),
            circle(80, 20, 13, 'none', 'c'), circle(80, 20, 4, 'c')
        ]
    },
    Pictophone: {
        theme: 6, shapes: [
            poly('18,4 86,4 86,56 18,56', 'd'), poly('24,10 80,10 80,50 24,50', 'w'), poly('28,48 44,26 60,48', 'n'),
            poly('50,48 62,34 76,48', 'd'), poly('14,66 70,66 70,84 14,84', 'd'), poly('70,66 94,75 70,84', 'b'),
            poly('87,72 94,75 87,78', 'n'), poly('4,66 14,66 14,84 4,84', 'p'), circle(70, 20, 5, 'p')
        ]
    },
    NomDeCode: {
        theme: 7, shapes: [
            poly('6,30 26,10 46,30 26,50', 'd'), poly('44,26 94,26 94,34 44,34', 'd'), poly('74,34 82,34 82,44 74,44', 'b'),
            poly('86,34 94,34 94,48 86,48', 'c'), poly('30,62 60,62 60,94 30,94', 'b'), poly('64,62 94,62 94,94 64,94', 'c'),
            circle(26, 30, 6, 'w')
        ]
    }
};

/** The seven pieces of a tangram square, on the 100 x 100 art grid. */
const TANGRAM = ['0,0 100,0 50,50', '0,0 50,50 0,100', '100,0 100,50 75,75 75,25', '75,25 75,75 50,50',
    '50,50 75,75 50,100 25,75', '25,75 50,100 0,100', '100,50 100,100 50,100'];
const TANGRAM_FILLS: Fill[][] = [
    ['d', 'b', 'n', 'p', 'w', 'c', 'd'],
    ['b', 'd', 'c', 'w', 'n', 'p', 'b'],
    ['d', 'n', 'b', 'c', 'p', 'w', 'n'],
    ['n', 'd', 'p', 'b', 'c', 'd', 'w']
];

function hash(id: string): number {
    let h = 0;
    for (const ch of id) h = (h * 31 + (ch.codePointAt(0) ?? 0)) >>> 0;
    return h;
}

export const GAME_BOX_THEMES = 8;

/** Colour theme (0 to 7) for a game, shared by its box and anything that previews it, such as playlist spines. */
export function gameBoxTheme(id: string): number {
    return COVERS[id]?.theme ?? hash(id) % GAME_BOX_THEMES;
}

export function gameBoxArt(id: string): BoxArt {
    const cover = COVERS[id];
    if (cover) return cover;
    const h = hash(id);
    // Unsigned shifts: the hash can exceed 2^31, and a signed shift would make the index negative.
    const fills = TANGRAM_FILLS[(h >>> 3) % TANGRAM_FILLS.length];
    return { theme: h % GAME_BOX_THEMES, turn: ((h >>> 5) % 4) * 90, shapes: TANGRAM.map((pts, i) => poly(pts, fills[i])) };
}

export function playerRange(game: Pick<GameDefinition, 'minPlayers' | 'maxPlayers'>): string {
    return game.minPlayers === game.maxPlayers
        ? `${game.minPlayers} players`
        : `${game.minPlayers} to ${game.maxPlayers} players`;
}

/** A game's box: its colour on the title band and edge, a tangram cover, and the player count. */
@Component({
    selector: 'app-game-box',
    standalone: true,
    templateUrl: './game-box.component.html',
    styleUrls: ['./game-box.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class GameBoxComponent {
    readonly game = input.required<Pick<GameDefinition, 'id' | 'name' | 'minPlayers' | 'maxPlayers'>>();

    protected readonly art = computed(() => gameBoxArt(this.game().id));
    protected readonly players = computed(() => playerRange(this.game()));
    protected readonly turn = computed(() => {
        const turn = this.art().turn;
        return turn ? `rotate(${turn} 50 50)` : null;
    });
}
