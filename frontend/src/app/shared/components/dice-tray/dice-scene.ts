import * as THREE from 'three';
import { DiePose, simulateThrow } from './dice-physics';
import { DiceMotion, PIPS, SIDE_NORMALS, SIDE_VALUES, TrayDie, restingLayout, seededRandom, sideOf } from './dice-math';

export interface DiceLook {
    dieColor: string;
    pipColor: string;
    /** Colour of the single pip on a 1, which the brand dice show in pink. */
    onePipColor: string;
    /** Text to print instead of pips, one entry per value 1 to 6. */
    faces?: readonly string[];
}

/** Where a die sits on screen, as fractions of the tray's width and height. */
export interface DieHotspot { x: number; y: number; size: number }

interface DieSlot {
    holder: THREE.Group;
    mesh: THREE.Mesh;
    ring: THREE.LineLoop;
    pose: DiePose;
}

const UP_SIDE = 2; // +y in SIDE_NORMALS

/** Rounded cube: every vertex of a finely divided box pushed onto a cube with rounded edges. */
function roundedBox(size: number, radius: number, segments: number): THREE.BufferGeometry {
    const g = new THREE.BoxGeometry(size, size, size, segments, segments, segments);
    const p = g.attributes['position'] as THREE.BufferAttribute;
    const h = size / 2 - radius;
    const v = new THREE.Vector3();
    const inner = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) {
        v.fromBufferAttribute(p, i);
        inner.set(Math.max(-h, Math.min(h, v.x)), Math.max(-h, Math.min(h, v.y)), Math.max(-h, Math.min(h, v.z)));
        v.sub(inner);
        if (v.lengthSq() > 0) v.normalize().multiplyScalar(radius);
        v.add(inner);
        p.setXYZ(i, v.x, v.y, v.z);
    }
    g.computeVertexNormals();
    return g;
}

function canvasTexture(draw: (g: CanvasRenderingContext2D, w: number, h: number) => void, w: number, h: number): THREE.CanvasTexture {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    draw(c.getContext('2d')!, w, h);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
}

function faceTexture(value: number, look: DiceLook, body: string): THREE.CanvasTexture {
    return canvasTexture((g, S) => {
        g.fillStyle = body;
        g.fillRect(0, 0, S, S);
        const label = look.faces?.[value - 1];
        if (label) {
            g.fillStyle = look.pipColor;
            g.font = `700 ${label.length > 2 ? S * 0.3 : S * 0.5}px Outfit, sans-serif`;
            g.textAlign = 'center';
            g.textBaseline = 'middle';
            g.fillText(label, S / 2, S / 2 + S * 0.03);
            return;
        }
        const r = value === 1 ? S * 0.12 : S * 0.085;
        g.fillStyle = value === 1 ? look.onePipColor : look.pipColor;
        for (const [x, y] of PIPS[value]) {
            g.beginPath();
            g.arc(x * S, y * S, r, 0, Math.PI * 2);
            g.fill();
        }
    }, 256, 256);
}

/** Parchment floor with faint tangram triangles, matching the site background. */
function floorTexture(): THREE.CanvasTexture {
    return canvasTexture((g, W, H) => {
        g.fillStyle = '#f4ead5';
        g.fillRect(0, 0, W, H);
        const s = 140;
        const h = s * 0.866;
        for (let row = 0; row * h < H + h; row++) {
            for (let col = -1; col * s < W + s; col++) {
                const x = col * s + (row % 2 ? s / 2 : 0);
                const y = row * h;
                g.beginPath();
                g.moveTo(x, y); g.lineTo(x + s, y); g.lineTo(x + s / 2, y + h);
                g.closePath();
                g.fillStyle = (row + col) % 3 === 0 ? 'rgba(56,178,172,0.10)' : 'rgba(0,51,102,0.045)';
                g.fill();
            }
        }
    }, 1600, 900);
}

const normal = (side: number) => new THREE.Vector3(...SIDE_NORMALS[side]);

/**
 * The three.js side of the dice tray. Draws only when something moves.
 * The Angular component owns it and passes in what the server says.
 */
export class DiceScene {
    readonly trayDepth: number;

    private readonly renderer: THREE.WebGLRenderer;
    private readonly scene = new THREE.Scene();
    private readonly camera: THREE.PerspectiveCamera;
    private readonly geometry = roundedBox(1, 0.13, 8);
    private readonly materials = new Map<string, THREE.MeshStandardMaterial[]>();
    private readonly slots: DieSlot[] = [];
    private readonly resizer: ResizeObserver;
    private frameHandle = 0;
    private playback: { frames: DiePose[][]; i: number; stride: number; done: () => void } | null = null;
    private gathering: ((now: number) => void) | null = null;
    private disposed = false;

    /** `trayWidth` is in die widths: 16 for a big shared screen, smaller so phone dice are large enough to tap. */
    constructor(private readonly host: HTMLElement, aspect: number, private look: DiceLook, readonly trayWidth = 16) {
        this.trayDepth = trayWidth / aspect;
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.domElement.setAttribute('aria-hidden', 'true');
        host.appendChild(this.renderer.domElement);

        // Pull the camera back for deeper trays so the whole floor stays in view.
        const reach = Math.max(this.trayWidth / 16, this.trayDepth / 9);
        this.camera = new THREE.PerspectiveCamera(30, aspect, 0.1, 200);
        this.camera.position.set(0, 18 * reach, 11.5 * reach);
        this.camera.lookAt(0, 0, 0.4);

        this.scene.add(new THREE.HemisphereLight('#ffffff', '#e8dcc2', 1.15));
        const sun = new THREE.DirectionalLight('#fff6e8', 1.35);
        sun.position.set(-6, 15, 7);
        sun.castShadow = true;
        sun.shadow.mapSize.set(2048, 2048);
        const extent = Math.max(this.trayWidth, this.trayDepth) * 0.7;
        Object.assign(sun.shadow.camera, { left: -extent, right: extent, top: extent, bottom: -extent });
        sun.shadow.bias = -0.0005;
        this.scene.add(sun);
        this.buildTray();

        this.resizer = new ResizeObserver(() => this.resize());
        this.resizer.observe(host);
        this.resize();
    }

    /** Puts dice at rest showing their values, without a throw. Dice already on the table keep their place. */
    show(dice: readonly TrayDie[]): void {
        this.ensureSlots(dice);
        const home = restingLayout(dice.length, this.trayWidth, this.trayDepth);
        dice.forEach((d, i) => {
            const slot = this.slots[i];
            if (!slot.holder.visible) {
                const yaw = (seededRandom(i + 7)() - 0.5) * 0.5;
                const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
                slot.pose = { p: [home[i].x, 0.5, home[i].z], q: [q.x, q.y, q.z, q.w] };
                slot.holder.visible = true;
            }
            this.applyPose(slot);
            this.paint(slot, d, this.currentUpSide(slot));
        });
        this.requestRender();
    }

    /**
     * Throws every die that is not held, landing each on the value the server chose.
     * Same seed, same throw. Calls `done` when the dice settle.
     */
    throw(dice: readonly TrayDie[], seed: number, motion: Exclude<DiceMotion, 'none'>, done: () => void): void {
        this.ensureSlots(dice);
        this.show(dice.map(d => ({ ...d })));
        const result = simulateThrow({
            poses: this.slots.slice(0, dice.length).map(s => s.pose),
            thrown: dice.map(d => !d.held),
            trayWidth: this.trayWidth,
            trayDepth: this.trayDepth,
            seed,
            motion
        });
        if (!result) {
            // Nothing settled flat: show the values at rest rather than a wrong face.
            this.show(dice);
            done();
            return;
        }
        dice.forEach((d, i) => {
            if (!d.held) this.paint(this.slots[i], d, result.upSides[i]);
        });
        this.playback = {
            frames: result.frames,
            i: 0,
            stride: motion === 'short' ? 2 : 1,
            done: () => {
                result.frames[result.frames.length - 1].forEach((p, i) => { this.slots[i].pose = p; });
                done();
            }
        };
        this.requestRender();
    }

    /**
     * Slides every die into an even row, keeping the face that shows, so each has its own tap target.
     * Used on trays where players pick dice; the shared table keeps the natural scatter.
     */
    gather(count: number, done: () => void): void {
        const home = restingLayout(count, this.trayWidth, this.trayDepth);
        const from = this.slots.slice(0, count).map(s => [...s.pose.p] as [number, number, number]);
        const start = performance.now();
        const duration = 320;
        this.gathering = (now: number) => {
            const t = Math.min(1, (now - start) / duration);
            const ease = 1 - (1 - t) ** 3;
            this.slots.slice(0, count).forEach((slot, i) => {
                slot.pose = {
                    p: [from[i][0] + (home[i].x - from[i][0]) * ease, from[i][1], from[i][2] + (home[i].z - from[i][2]) * ease],
                    q: slot.pose.q
                };
                this.applyPose(slot);
            });
            if (t >= 1) {
                this.gathering = null;
                done();
            }
        };
        this.requestRender();
    }

    get isRolling(): boolean {
        return this.playback !== null || this.gathering !== null;
    }

    /** Lets a game restyle the dice mid-game (a player's colour, say). */
    setLook(look: DiceLook): void {
        this.look = look;
    }

    /** Where each die sits on screen, for the tap targets laid over the canvas. */
    hotspots(count: number): DieHotspot[] {
        const w = this.host.clientWidth || 1;
        const h = this.host.clientHeight || 1;
        return this.slots.slice(0, count).map(slot => {
            const centre = slot.holder.position.clone().project(this.camera);
            // 0.6 die widths either side: a target a little bigger than the die but narrower than the gap to the next.
            const edge = slot.holder.position.clone().add(new THREE.Vector3(0.6, 0, 0)).project(this.camera);
            const diameter = Math.abs(edge.x - centre.x) * w; // NDC spans 2, so this is already the full width
            return {
                x: (centre.x + 1) / 2,
                y: (1 - centre.y) / 2,
                size: diameter / h
            };
        });
    }

    dispose(): void {
        this.disposed = true;
        cancelAnimationFrame(this.frameHandle);
        this.resizer.disconnect();
        this.scene.traverse(o => {
            const m = o as THREE.Mesh;
            m.geometry?.dispose();
            const mats = Array.isArray(m.material) ? m.material : m.material ? [m.material] : [];
            mats.forEach(mat => {
                (mat as THREE.MeshStandardMaterial).map?.dispose();
                mat.dispose();
            });
        });
        this.renderer.dispose();
        this.renderer.domElement.remove();
    }

    private buildTray(): void {
        const floor = new THREE.Mesh(
            new THREE.PlaneGeometry(this.trayWidth, this.trayDepth),
            new THREE.MeshStandardMaterial({ map: floorTexture(), roughness: 0.95 })
        );
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        this.scene.add(floor);

        const wallMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.6 });
        const edgeMat = new THREE.LineBasicMaterial({ color: '#00285c' });
        const wall = (w: number, d: number, x: number, z: number) => {
            const geo = new THREE.BoxGeometry(w, 0.8, d);
            const m = new THREE.Mesh(geo, wallMat);
            m.position.set(x, 0.4, z);
            m.castShadow = true;
            m.receiveShadow = true;
            m.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo), edgeMat));
            this.scene.add(m);
        };
        wall(0.4, this.trayDepth + 0.8, -this.trayWidth / 2 - 0.2, 0);
        wall(0.4, this.trayDepth + 0.8, this.trayWidth / 2 + 0.2, 0);
        wall(this.trayWidth, 0.4, 0, -this.trayDepth / 2 - 0.2);
        wall(this.trayWidth, 0.4, 0, this.trayDepth / 2 + 0.2);
    }

    private ensureSlots(dice: readonly TrayDie[]): void {
        while (this.slots.length < dice.length) {
            const holder = new THREE.Group();
            const mesh = new THREE.Mesh(this.geometry, this.materialsFor(this.look.dieColor));
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            holder.add(mesh);
            // Marker on the floor under the die: navy when held, pink when picked.
            const ring = new THREE.LineLoop(
                new THREE.BufferGeometry().setFromPoints([[-0.7, -0.7], [0.7, -0.7], [0.7, 0.7], [-0.7, 0.7]].map(([x, z]) => new THREE.Vector3(x, 0.02, z))),
                new THREE.LineBasicMaterial({ color: '#e8179b' })
            );
            ring.visible = false;
            holder.visible = false;
            this.scene.add(holder, ring);
            this.slots.push({ holder, mesh, ring, pose: { p: [0, 0.5, 0], q: [0, 0, 0, 1] } });
        }
        this.slots.forEach((s, i) => {
            if (i >= dice.length) { s.holder.visible = false; s.ring.visible = false; }
        });
    }

    private materialsFor(body: string): THREE.MeshStandardMaterial[] {
        const key = `${body}|${this.look.pipColor}|${this.look.onePipColor}|${this.look.faces?.join(',') ?? ''}`;
        let mats = this.materials.get(key);
        if (!mats) {
            mats = SIDE_VALUES.map(v => new THREE.MeshStandardMaterial({ map: faceTexture(v, this.look, body), roughness: 0.32 }));
            this.materials.set(key, mats);
        }
        return mats;
    }

    /** Turns the die's faces inside its body so `die.value` sits on the side that is (or will be) facing up. */
    private paint(slot: DieSlot, die: TrayDie, upSide: number): void {
        slot.mesh.material = this.materialsFor(die.color ?? this.look.dieColor);
        slot.mesh.quaternion.setFromUnitVectors(normal(sideOf(die.value)), normal(upSide));
        slot.ring.visible = !!(die.held || die.selected);
        (slot.ring.material as THREE.LineBasicMaterial).color.set(die.selected ? '#e8179b' : '#00285c');
    }

    /** Which side of the holder currently faces up (the holder carries the physics pose). */
    private currentUpSide(slot: DieSlot): number {
        const q = new THREE.Quaternion(...slot.pose.q);
        let side = UP_SIDE;
        let best = -2;
        SIDE_NORMALS.forEach((_, i) => {
            const y = normal(i).applyQuaternion(q).y;
            if (y > best) { best = y; side = i; }
        });
        return side;
    }

    private applyPose(slot: DieSlot): void {
        slot.holder.position.set(...slot.pose.p);
        slot.holder.quaternion.set(...slot.pose.q);
        slot.ring.position.set(slot.pose.p[0], 0, slot.pose.p[2]);
    }

    private resize(): void {
        const w = this.host.clientWidth;
        const h = this.host.clientHeight;
        if (!w || !h) return;
        this.renderer.setSize(w, h, false);
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        this.requestRender();
    }

    private requestRender(): void {
        if (this.disposed || this.frameHandle) return;
        this.frameHandle = requestAnimationFrame(() => {
            this.frameHandle = 0;
            this.frame();
        });
    }

    private frame(): void {
        const gather = this.gathering;
        if (gather) {
            gather(performance.now());
            // The step clears itself when the dice reach the row.
            if (this.gathering === gather) this.requestRender();
        }
        const pb = this.playback;
        if (pb) {
            const idx = Math.min(pb.frames.length - 1, pb.i);
            pb.i += pb.stride;
            pb.frames[idx].forEach((p, i) => {
                const slot = this.slots[i];
                slot.pose = p;
                this.applyPose(slot);
            });
            if (idx === pb.frames.length - 1) {
                this.playback = null;
                pb.done();
            } else {
                this.requestRender();
            }
        }
        this.renderer.render(this.scene, this.camera);
    }
}
