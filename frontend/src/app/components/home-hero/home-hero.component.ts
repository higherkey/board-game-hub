import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  ViewChild,
  inject,
  signal
} from '@angular/core';
import { gsap } from 'gsap';

export type ConceptStage = 'host' | 'join' | 'play';

interface StageMeta {
  id: ConceptStage;
  num: string;
  title: string;
  caption: string;
}

/**
 * Shared Home hero: Host, Join and Play.
 * All three stages (Host → Join → Play) are laid out side by side and play in sequence,
 * so visitors see the whole flow at once instead of reading about it.
 */
@Component({
  selector: 'app-home-hero',
  standalone: true,
  templateUrl: './home-hero.component.html',
  styleUrl: './home-hero.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeHeroComponent implements AfterViewInit, OnDestroy {
  private readonly zone = inject(NgZone);

  @ViewChild('hero', { static: true }) heroRef!: ElementRef<HTMLElement>;

  readonly stages: StageMeta[] = [
    { id: 'host', num: '01', title: 'Host', caption: 'Pick a game on any big screen.' },
    { id: 'join', num: '02', title: 'Join', caption: 'Scan or type the code on your phone.' },
    { id: 'play', num: '03', title: 'Play', caption: 'Your phone is your hand. The TV is the table.' }
  ];

  readonly pickerGames = [
    { key: 'dice', icon: 'bi-dice-5-fill' },
    { key: 'cards', icon: 'bi-suit-spade-fill' },
    { key: 'letters', icon: 'bi-alphabet' },
    { key: 'strategy', icon: 'bi-grid-3x3-gap-fill' },
    { key: 'drawing', icon: 'bi-palette-fill' },
    { key: 'puzzle', icon: 'bi-puzzle-fill' }
  ];
  /** The host picks a card game, which is what Stage 3 then plays. */
  readonly chosenGame = 'cards';
  readonly codeLetters = ['A', 'B', 'C', 'D'];
  /** 5x5 decorative QR pattern (1 = dark cell). */
  readonly qrCells = [
    1, 1, 0, 1, 1,
    1, 0, 1, 0, 1,
    0, 1, 1, 1, 0,
    1, 0, 1, 0, 1,
    1, 1, 0, 1, 1
  ];
  readonly handCards = [0, 1, 2];

  readonly activeStage = signal<ConceptStage>('host');
  readonly isPaused = signal(false);
  readonly isStatic = signal(false);

  private timeline?: gsap.core.Timeline;
  private resizeObserver?: ResizeObserver;
  private intersectionObserver?: IntersectionObserver;
  private resizeTimer?: ReturnType<typeof setTimeout>;
  private initialFrame?: number;
  private motionQuery?: MediaQueryList;
  private readonly onMotionChange = (event: MediaQueryListEvent): void => {
    this.zone.runOutsideAngular(() => this.applyMotionPreference(event.matches));
  };
  private destroyed = false;
  private isOnScreen = false;
  private lastWidth = 0;

  ngAfterViewInit(): void {
    this.zone.runOutsideAngular(() => {
      this.motionQuery = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)');
      this.motionQuery?.addEventListener?.('change', this.onMotionChange);
      this.applyMotionPreference(this.motionQuery?.matches ?? false);
    });
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.motionQuery?.removeEventListener?.('change', this.onMotionChange);
    this.stopMotion();
  }

  private applyMotionPreference(reduceMotion: boolean): void {
    if (this.destroyed) {
      return;
    }
    if (reduceMotion) {
      this.stopMotion();
      this.isStatic.set(true);
    } else {
      this.isStatic.set(false);
      this.startMotion();
    }
  }

  private startMotion(): void {
    if (this.timeline || this.initialFrame !== undefined) {
      return;
    }
    this.activeStage.set('host');
    this.observeVisibility();
    // Wait a frame so layout settles after leaving the static state.
    this.initialFrame = requestAnimationFrame(() => {
      this.initialFrame = undefined;
      this.buildTimeline();
    });
    this.observeResize();
  }

  private stopMotion(): void {
    if (this.initialFrame !== undefined) {
      cancelAnimationFrame(this.initialFrame);
      this.initialFrame = undefined;
    }
    clearTimeout(this.resizeTimer);
    this.resizeTimer = undefined;
    this.resizeObserver?.disconnect();
    this.resizeObserver = undefined;
    this.intersectionObserver?.disconnect();
    this.intersectionObserver = undefined;
    this.isOnScreen = false;
    this.timeline?.revert();
    this.timeline = undefined;
  }

  togglePause(): void {
    if (!this.timeline) {
      return;
    }
    const paused = !this.isPaused();
    this.isPaused.set(paused);
    this.syncPlayback();
  }

  jumpTo(stage: ConceptStage): void {
    if (!this.timeline) {
      return;
    }
    this.timeline.seek(stage);
    this.activeStage.set(stage);
  }

  private syncPlayback(): void {
    if (!this.timeline) {
      return;
    }
    if (this.isPaused() || !this.isOnScreen) {
      this.timeline.pause();
    } else {
      this.timeline.play();
    }
  }

  private observeResize(): void {
    if (typeof ResizeObserver === 'undefined') {
      return;
    }
    this.lastWidth = Math.round(this.heroRef.nativeElement.clientWidth);
    const observer = new ResizeObserver(entries => {
      if (this.resizeObserver !== observer || this.destroyed || this.isStatic()) {
        return;
      }
      const width = Math.round(entries[0].contentRect.width);
      if (width === this.lastWidth) {
        return;
      }
      this.lastWidth = width;
      clearTimeout(this.resizeTimer);
      this.resizeTimer = setTimeout(() => this.rebuildTimeline(), 200);
    });
    this.resizeObserver = observer;
    observer.observe(this.heroRef.nativeElement);
  }

  private observeVisibility(): void {
    if (typeof IntersectionObserver === 'undefined') {
      this.isOnScreen = true;
      return;
    }
    const observer = new IntersectionObserver(entries => {
      if (this.intersectionObserver !== observer || this.destroyed || this.isStatic()) {
        return;
      }
      this.isOnScreen = entries[0].isIntersecting;
      this.syncPlayback();
    });
    this.intersectionObserver = observer;
    observer.observe(this.heroRef.nativeElement);
  }

  private rebuildTimeline(): void {
    if (this.destroyed || this.isStatic()) {
      return;
    }
    const time = this.timeline?.time() ?? 0;
    // revert() strips every inline style the timeline wrote, so flight paths are re-measured from rest.
    this.timeline?.revert();
    this.buildTimeline();
    this.timeline?.seek(time, false);
    this.syncPlayback();
  }

  /** Distance from the centre of `from` to the centre of `to`, plus the scale needed to match widths. */
  private flightPath(from: Element | null, to: Element | null): { x: number; y: number; scale: number } {
    if (!from || !to) {
      return { x: 0, y: 0, scale: 1 };
    }
    const a = from.getBoundingClientRect();
    const b = to.getBoundingClientRect();
    return {
      x: b.left + b.width / 2 - (a.left + a.width / 2),
      y: b.top + b.height / 2 - (a.top + a.height / 2),
      scale: a.width > 0 ? b.width / a.width : 1
    };
  }

  /** Offset that moves the tip (top-left corner) of `pointer` to just inside the centre of `target`. */
  private pointerPath(pointer: Element | null, target: Element | null): { x: number; y: number } {
    if (!pointer || !target) {
      return { x: 0, y: 0 };
    }
    const a = pointer.getBoundingClientRect();
    const b = target.getBoundingClientRect();
    return {
      x: b.left + b.width * 0.45 - a.left,
      y: b.top + b.height * 0.45 - a.top
    };
  }

  private buildTimeline(): void {
    if (this.destroyed || this.isStatic()) {
      return;
    }
    const root = this.heroRef.nativeElement;
    const q = (sel: string) => root.querySelectorAll(sel);
    const one = (sel: string) => root.querySelector(sel);

    const flightA = this.flightPath(one('.dc-hand--a .dc-card--chosen'), one('.dc-slot--a'));
    const flightB = this.flightPath(one('.dc-hand--b .dc-card--chosen'), one('.dc-slot--b'));

    const cursorPath = this.pointerPath(one('.dc-cursor'), one('.dc-pick--chosen'));
    const highlight = getComputedStyle(root).getPropertyValue('--accent').trim() || undefined;

    const tl = gsap.timeline({ paused: true, repeat: -1, repeatDelay: 1.2, defaults: { ease: 'power2.out' } });

    // ---------- Stage 1: HOST ----------
    // Slower than the other stages: the cursor glides in, hovers, then clicks the card game.
    tl.addLabel('host')
      .call(() => this.activeStage.set('host'))
      .fromTo(one('.dc-cursor'), { opacity: 0 }, { opacity: 1, duration: 0.4 }, 'host+=0.4')
      .fromTo(one('.dc-cursor'),
        { x: 0, y: 0 },
        { x: cursorPath.x, y: cursorPath.y, duration: 1.6, ease: 'power2.inOut' }, '<')
      .to(one('.dc-cursor'), { scale: 0.82, duration: 0.15, yoyo: true, repeat: 1 }, '>+0.35')
      .to(one('.dc-pick--chosen'), {
        scale: 1.15, backgroundColor: highlight, duration: 0.35, ease: 'back.out(3)'
      }, '<+0.1')
      .to(q('.dc-pick:not(.dc-pick--chosen)'), { opacity: 0, scale: 0.8, duration: 0.45, stagger: 0.05 }, '>+0.4')
      .to([one('.dc-pick--chosen'), one('.dc-cursor')], { opacity: 0, duration: 0.35 }, '>+0.2')
      .fromTo(one('.dc-roomcard'), { opacity: 0, scale: 0.85 }, { opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(2)' }, '>')
      .fromTo(q('.dc-scene--host .dc-code-letter'),
        { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.3, stagger: 0.14 }, '>-0.1')
      .fromTo(one('.dc-scene--host .dc-qr'), { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(2)' }, '<')
      .fromTo(q('.dc-scene--host .dc-qr-cell'),
        { opacity: 0 }, { opacity: 1, duration: 0.2, stagger: { each: 0.02, from: 'random' } }, '<');

    // The progress bar spans the whole stage, including a hold on the finished room code.
    const joinAt = tl.duration() + 1;
    tl.to(one('[data-progress="host"]'), { scaleX: 1, duration: joinAt, ease: 'none' }, 'host');

    // ---------- Stage 2: JOIN ----------
    tl.addLabel('join', joinAt)
      .call(() => this.activeStage.set('join'), [], 'join')
      .to(one('[data-progress="join"]'), { scaleX: 1, duration: 4.2, ease: 'none' }, 'join')
      // Phone A scans the QR code
      .fromTo(one('.dc-scanline'), { insetBlockStart: '0%' }, { insetBlockStart: '100%', duration: 0.8, ease: 'sine.inOut', yoyo: true, repeat: 1 }, 'join+=0.2')
      .to(one('.dc-phone--a .dc-joined'), { opacity: 1, duration: 0.3 }, '>')
      .fromTo(one('.dc-seat--a .dc-avatar'), { opacity: 0, scale: 0.4 }, { opacity: 1, scale: 1, duration: 0.45, ease: 'back.out(3)' }, '<+0.1')
      // Phone B types the code
      .fromTo(q('.dc-phone--b .dc-type-letter'), { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.15, stagger: 0.22 }, 'join+=0.6')
      .to(one('.dc-phone--b .dc-join-btn'), { scale: 0.85, duration: 0.12, yoyo: true, repeat: 1 }, '>+0.15')
      .to(one('.dc-phone--b .dc-joined'), { opacity: 1, duration: 0.3 }, '>')
      .fromTo(one('.dc-seat--b .dc-avatar'), { opacity: 0, scale: 0.4 }, { opacity: 1, scale: 1, duration: 0.45, ease: 'back.out(3)' }, '<+0.1')
      .to(one('.dc-lobby-ready'), { opacity: 1, duration: 0.3 }, '>+0.1');

    // ---------- Stage 3: PLAY ----------
    tl.addLabel('play', '>+0.6')
      .call(() => this.activeStage.set('play'), [], 'play')
      .to(one('[data-progress="play"]'), { scaleX: 1, duration: 4, ease: 'none' }, 'play')
      .to(one('.dc-hand--a .dc-card--chosen'), { y: -10, rotation: 0, duration: 0.3 }, 'play+=0.3')
      .to(one('.dc-hand--a .dc-card--chosen'), {
        x: flightA.x, y: flightA.y, scale: flightA.scale, duration: 0.8, ease: 'power3.inOut'
      }, '>+0.1')
      .set(one('.dc-slot--a .dc-placed'), { opacity: 1 }, '>')
      .set(one('.dc-hand--a .dc-card--chosen'), { opacity: 0 }, '<')
      .fromTo(one('.dc-score--a .dc-plus'), { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.3, ease: 'back.out(3)' }, '<')
      .to(one('.dc-hand--b .dc-card--chosen'), { y: -10, rotation: 0, duration: 0.3 }, '>+0.3')
      .to(one('.dc-hand--b .dc-card--chosen'), {
        x: flightB.x, y: flightB.y, scale: flightB.scale, duration: 0.8, ease: 'power3.inOut'
      }, '>+0.1')
      .set(one('.dc-slot--b .dc-placed'), { opacity: 1 }, '>')
      .set(one('.dc-hand--b .dc-card--chosen'), { opacity: 0 }, '<')
      .fromTo(one('.dc-score--b .dc-plus'), { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.3, ease: 'back.out(3)' }, '<')
      .fromTo(one('.dc-board-glow'), { opacity: 0 }, { opacity: 1, duration: 0.3, yoyo: true, repeat: 1 }, '>+0.1');

    this.timeline = tl;
    this.syncPlayback();
  }
}
