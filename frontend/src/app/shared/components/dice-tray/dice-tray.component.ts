import {
    AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, OnChanges, OnDestroy, SimpleChanges,
    ViewChild, computed, input, output, signal
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { DiceMotion, PIPS, TrayDie, canUseWebGl, prefersReducedMotion, seedFrom } from './dice-math';
import type { DiceScene, DieHotspot } from './dice-scene';

/**
 * A tray of six-sided dice, for any game.
 *
 * The server decides every value; the tray only shows them. When `rollId` changes, every die that is not
 * held is thrown and lands on its value. The throw is seeded from `rollId`, so the table and every phone
 * show the same tumble. A tray that first appears mid-game (a refresh, a late join) shows the dice at rest:
 * it never replays an old throw.
 *
 * The 3D tray (three.js and cannon-es) loads only when a tray is on screen. With reduced motion, without
 * WebGL, or with `motion="none"`, the dice are drawn flat instead.
 */
@Component({
    selector: 'app-dice-tray',
    standalone: true,
    imports: [NgTemplateOutlet],
    templateUrl: './dice-tray.component.html',
    styleUrls: ['./dice-tray.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DiceTrayComponent implements AfterViewInit, OnChanges, OnDestroy {
    /** The dice, in a stable order. Values come from the server. */
    readonly dice = input.required<readonly TrayDie[]>();
    /** Changes once per real roll on the server. `null` before the first roll. */
    readonly rollId = input<string | number | null>(null);
    /** `full` on the shared table, `short` on phones, `none` for still dice. */
    readonly motion = input<DiceMotion>('full');
    /** Dice can be tapped (or picked with the keyboard) to toggle them. */
    readonly selectable = input(false);
    /** Text instead of pips, one entry per value 1 to 6 (letters, symbols). */
    readonly faces = input<readonly string[] | undefined>(undefined);
    readonly dieColor = input('#ffffff');
    readonly pipColor = input('#00285c');
    readonly onePipColor = input('#e8179b');
    /** Width over height of the tray. */
    readonly aspect = input(16 / 9);
    /** After a throw, slide the dice into a row so each is easy to tap. Defaults to on when dice are tappable. */
    readonly gather = input<boolean | undefined>(undefined);
    /** Names the dice for screen readers, as in "Your dice". */
    readonly label = input('Dice');

    /** A die was tapped; the game decides what that means (hold, keep, reroll). */
    readonly dieToggle = output<number>();
    /** A throw settled; carries the values now showing. */
    readonly settled = output<number[]>();

    @ViewChild('stage', { static: true }) private readonly stage!: ElementRef<HTMLElement>;

    /** True once the 3D tray is drawing; until then (or without it) the flat dice show. */
    protected readonly threeD = signal(false);
    protected readonly rolling = signal(false);
    protected readonly hotspots = signal<DieHotspot[]>([]);
    protected readonly pips = PIPS;

    protected readonly still = computed(() => this.motion() === 'none' || !this.threeD());
    protected readonly summary = computed(() =>
        this.dice().map((d, i) => this.dieLabel(d, i)).join('. '));

    protected dieLabel(d: TrayDie, i: number): string {
        return `Die ${i + 1}, ${d.value}${d.held ? ', held' : ''}${d.selected ? ', picked' : ''}`;
    }

    private scene: DiceScene | null = null;
    private lastRollId: string | number | null | undefined = undefined;
    private destroyed = false;

    ngAfterViewInit(): void {
        // The first roll id is history: show it at rest.
        this.lastRollId = this.rollId();
        if (this.motion() !== 'none' && !prefersReducedMotion() && canUseWebGl()) {
            void this.loadScene();
        }
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (!this.scene) return;
        if (changes['dieColor'] || changes['pipColor'] || changes['onePipColor'] || changes['faces']) {
            this.scene.setLook(this.look());
        }
        const rollId = this.rollId();
        if (rollId !== this.lastRollId && rollId !== null) {
            this.lastRollId = rollId;
            this.throwDice(rollId);
        } else if (!this.scene.isRolling) {
            this.scene.show(this.dice());
            this.updateHotspots();
        }
    }

    ngOnDestroy(): void {
        this.destroyed = true;
        this.scene?.dispose();
    }

    protected toggle(index: number): void {
        if (this.selectable() && !this.rolling() && !this.dice()[index]?.locked) this.dieToggle.emit(index);
    }

    protected pipRadius(value: number): number {
        return value === 1 ? 12 : 9;
    }

    /** Phones get a table sized to the dice, so each die is big enough to tap; shared screens keep the full table. */
    private trayWidth(): number {
        return this.motion() === 'short' ? Math.max(7, this.dice().length * 1.45 + 1.5) : 16;
    }

    private look() {
        return { dieColor: this.dieColor(), pipColor: this.pipColor(), onePipColor: this.onePipColor(), faces: this.faces() };
    }

    private async loadScene(): Promise<void> {
        try {
            const { DiceScene } = await import('./dice-scene');
            if (this.destroyed) return;
            this.scene = new DiceScene(this.stage.nativeElement, this.aspect(), this.look(), this.trayWidth());
            this.scene.show(this.dice());
            this.threeD.set(true);
            // Let the canvas take its size before measuring where the dice are.
            requestAnimationFrame(() => this.updateHotspots());
        } catch {
            this.threeD.set(false); // keep the flat dice
        }
    }

    private throwDice(rollId: string | number): void {
        const scene = this.scene!;
        const motion = this.motion() === 'none' ? 'short' : this.motion() as 'full' | 'short';
        this.rolling.set(true);
        this.hotspots.set([]);
        scene.throw(this.dice(), seedFrom(rollId), motion, () => {
            if (this.gather() ?? this.selectable()) {
                scene.gather(this.dice().length, () => this.finishThrow());
            } else {
                this.finishThrow();
            }
        });
    }

    private finishThrow(): void {
        this.rolling.set(false);
        // Values may have moved on while the dice were in the air.
        this.scene!.show(this.dice());
        this.updateHotspots();
        this.settled.emit(this.dice().map(d => d.value));
    }

    private updateHotspots(): void {
        if (this.scene) this.hotspots.set(this.scene.hotspots(this.dice().length));
    }
}
