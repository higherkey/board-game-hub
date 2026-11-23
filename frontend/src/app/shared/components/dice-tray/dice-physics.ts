import * as CANNON from 'cannon-es';
import { DiceMotion, SIDE_NORMALS, seededRandom } from './dice-math';

/** A die's place and turn: position [x, y, z] and quaternion [x, y, z, w]. */
export interface DiePose {
    p: [number, number, number];
    q: [number, number, number, number];
}

export interface ThrowRequest {
    /** Where every die is now. Held dice stay exactly here. */
    poses: DiePose[];
    /** Which dice are thrown; the rest are held. */
    thrown: boolean[];
    trayWidth: number;
    trayDepth: number;
    seed: number;
    motion: Exclude<DiceMotion, 'none'>;
}

export interface ThrowResult {
    /** One entry per recorded frame (60 a second), each holding every die's pose. */
    frames: DiePose[][];
    /** For every die, the side (index into SIDE_VALUES) facing up at the end. */
    upSides: number[];
}

const STEP = 1 / 120;
const MAX_SECONDS = 8;
const ATTEMPTS = 12;

/** Side facing up for a rotation, and whether the die lies flat rather than leaning on something. */
export function upSide(q: readonly [number, number, number, number]): { side: number; flat: boolean } {
    const [x, y, z, w] = q;
    let side = 0;
    let best = -2;
    SIDE_NORMALS.forEach(([nx, ny, nz], i) => {
        // y component of the normal rotated by q.
        const up = 2 * (x * y + w * z) * nx + (1 - 2 * (x * x + z * z)) * ny + 2 * (y * z - w * x) * nz;
        if (up > best) { best = up; side = i; }
    });
    return { side, flat: best > 0.96 };
}

function world() {
    const w = new CANNON.World({ gravity: new CANNON.Vec3(0, -32, 0), allowSleep: true });
    (w.solver as CANNON.GSSolver).iterations = 14;
    const ground = new CANNON.Material('ground');
    const die = new CANNON.Material('die');
    w.addContactMaterial(new CANNON.ContactMaterial(ground, die, { friction: 0.28, restitution: 0.35 }));
    w.addContactMaterial(new CANNON.ContactMaterial(die, die, { friction: 0.2, restitution: 0.3 }));
    return { w, ground, die };
}

function addWalls(w: CANNON.World, ground: CANNON.Material, width: number, depth: number) {
    const plane = (x: number, z: number, rx: number, ry: number) => {
        const b = new CANNON.Body({ mass: 0, material: ground, shape: new CANNON.Plane() });
        b.position.set(x, 0, z);
        b.quaternion.setFromEuler(rx, ry, 0);
        w.addBody(b);
    };
    plane(0, 0, -Math.PI / 2, 0);
    plane(-width / 2, 0, 0, Math.PI / 2);
    plane(width / 2, 0, 0, -Math.PI / 2);
    plane(0, -depth / 2, 0, 0);
    plane(0, depth / 2, 0, Math.PI);
}

const pose = (b: CANNON.Body): DiePose => ({
    p: [b.position.x, b.position.y, b.position.z],
    q: [b.quaternion.x, b.quaternion.y, b.quaternion.z, b.quaternion.w]
});

/**
 * Throws the dice off-screen and records the tumble. Seeded, so the same request gives the same throw.
 * Retries when a die ends up leaning against a wall or another die. Returns null if none settle flat.
 */
export function simulateThrow(req: ThrowRequest): ThrowResult | null {
    const rnd = seededRandom(req.seed);
    const range = (a: number, b: number) => a + rnd() * (b - a);
    const short = req.motion === 'short';
    const thrownCount = req.thrown.filter(Boolean).length;

    for (let attempt = 0; attempt < ATTEMPTS; attempt++) {
        const { w, ground, die } = world();
        addWalls(w, ground, req.trayWidth, req.trayDepth);
        let lane = 0;
        const bodies = req.poses.map((start, i) => {
            const held = !req.thrown[i];
            const b = new CANNON.Body({
                mass: held ? 0 : 1,
                material: die,
                shape: new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5)),
                linearDamping: 0.08,
                angularDamping: 0.12,
                allowSleep: true,
                sleepSpeedLimit: 0.25,
                sleepTimeLimit: short ? 0.2 : 0.35
            });
            if (held) {
                b.position.set(...start.p);
                b.quaternion.set(...start.q);
            } else {
                // Thrown in from the left edge, spread down its length, spinning.
                const spread = thrownCount > 1 ? -1 + 2 * lane / (thrownCount - 1) : 0;
                lane++;
                const x = -req.trayWidth / 2 + 1.1 + (lane % 2) * 0.8;
                b.position.set(x, range(short ? 1.4 : 2.2, short ? 2.2 : 3.6), spread * (req.trayDepth / 2 - 1.2) + range(-0.3, 0.3));
                b.quaternion.setFromEuler(range(0, 6.28), range(0, 6.28), range(0, 6.28));
                // Scaled to the tray, so a small phone tray gets a gentle toss and the big table a proper throw.
                const speed = short ? range(0.6, 0.85) * req.trayWidth : range(15, 22);
                b.velocity.set(speed, range(-1, 3), range(-3, 3));
                const spin = short ? 18 : 28;
                b.angularVelocity.set(range(-spin, spin), range(-spin, spin), range(-spin, spin));
            }
            w.addBody(b);
            return { b, held };
        });

        const frames: DiePose[][] = [];
        const snap = () => frames.push(bodies.map(({ b }) => pose(b)));
        snap();
        for (let step = 1; step < MAX_SECONDS / STEP; step++) {
            w.step(STEP);
            if (step % 2 === 0) snap();
            if (bodies.every(({ b, held }) => held || b.sleepState === CANNON.Body.SLEEPING)) break;
        }
        snap();

        const last = frames[frames.length - 1];
        const ups = last.map(f => upSide(f.q));
        if (ups.every((u, i) => u.flat || !req.thrown[i])) {
            return { frames, upSides: ups.map(u => u.side) };
        }
    }
    return null;
}
