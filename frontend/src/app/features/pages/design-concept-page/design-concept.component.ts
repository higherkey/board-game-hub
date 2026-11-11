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
import { RouterModule } from '@angular/router';
import { gsap } from 'gsap';

export type ConceptStage = 'host' | 'join' | 'play';

interface StageMeta {
  id: ConceptStage;
  num: string;
  title: string;
  caption: string;
}

/**
 * Design concept: hero animation overhaul.
 * All three stages (Host → Join → Play) are laid out side by side and play in sequence,
 * so visitors see the whole flow at once instead of reading about it.
 */
@Component({
  selector: 'app-design-concept',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './design-concept.component.html',
  styleUrl: './design-concept.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DesignConceptComponent implements AfterViewInit, OnDestroy {
  private readonly zone = inject(NgZone);

  @ViewChild('hero', { static: true }) heroRef!: ElementRef<HTMLElement>;

  readonly stages: StageMeta[] = [
    { id: 'host', num: '01', title: 'Host', caption: 'Pick a game on any big screen.' },
    { id: 'join', num: '02', title: 'Join', caption: 'Scan or type the code on your phone.' },
    { id: 'play', num: '03', title: 'Play', caption: 'Your phone is your hand. The TV is the table.' }
  ];

  readonly pickerGames = ['🎲', '🃏', '🔤', '♟️', '🎨', '🧩'];
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
  private isOnScreen = true;
  private lastWidth = 0;

  ngAfterViewInit(): void {
    const reduceMotion = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    if (reduceMotion) {
      this.isStatic.set(true);
      return;
    }

    this.zone.runOutsideAngular(() => {
      // Wait a frame so fonts/layout settle before measuring flight paths.
      requestAnimationFrame(() => this.buildTimeline());
      this.observeResize();
      this.observeVisibility();
    });
  }

  ngOnDestroy(): void {
    clearTimeout(this.resizeTimer);
    this.resizeObserver?.disconnect();
    this.intersectionObserver?.disconnect();
    this.timeline?.revert();
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
    this.lastWidth = this.heroRef.nativeElement.clientWidth;
    this.resizeObserver = new ResizeObserver(entries => {
      const width = Math.round(entries[0].contentRect.width);
      if (width === this.lastWidth) {
        return;
      }
      this.lastWidth = width;
      clearTimeout(this.resizeTimer);
      this.resizeTimer = setTimeout(() => this.rebuildTimeline(), 200);
    });
    this.resizeObserver.observe(this.heroRef.nativeElement);
  }

  private observeVisibility(): void {
    if (typeof IntersectionObserver === 'undefined') {
      return;
    }
    this.intersectionObserver = new IntersectionObserver(entries => {
      this.isOnScreen = entries[0].isIntersecting;
      this.syncPlayback();
    });
    this.intersectionObserver.observe(this.heroRef.nativeElement);
  }

  private rebuildTimeline(): void {
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

  private buildTimeline(): void {
    const root = this.heroRef.nativeElement;
    const q = (sel: string) => root.querySelectorAll(sel);
    const one = (sel: string) => root.querySelector(sel);

    const flightA = this.flightPath(one('.dc-hand--a .dc-card--chosen'), one('.dc-slot--a'));
    const flightB = this.flightPath(one('.dc-hand--b .dc-card--chosen'), one('.dc-slot--b'));

    const tl = gsap.timeline({ repeat: -1, repeatDelay: 1.2, defaults: { ease: 'power2.out' } });

    // ---------- Stage 1: HOST ----------
    tl.addLabel('host')
      .call(() => this.activeStage.set('host'))
      .to(one('[data-progress="host"]'), { scaleX: 1, duration: 3.6, ease: 'none' }, 'host')
      .fromTo(one('.dc-cursor'),
        { opacity: 0, xPercent: 180, yPercent: 220 },
        { opacity: 1, xPercent: 0, yPercent: 0, duration: 0.9, ease: 'power3.out' }, 'host+=0.3')
      .to(one('.dc-cursor'), { scale: 0.8, duration: 0.12, yoyo: true, repeat: 1 }, '>')
      .to(one('.dc-pick--chosen'), { scale: 1.12, duration: 0.25, ease: 'back.out(3)' }, '<')
      .to(q('.dc-pick:not(.dc-pick--chosen)'), { opacity: 0, scale: 0.8, duration: 0.3, stagger: 0.03 }, '>+0.1')
      .to([one('.dc-pick--chosen'), one('.dc-cursor')], { opacity: 0, duration: 0.25 }, '>')
      .fromTo(one('.dc-roomcard'), { opacity: 0, scale: 0.85 }, { opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(2)' }, '>')
      .fromTo(q('.dc-scene--host .dc-code-letter'),
        { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.25, stagger: 0.1 }, '>-0.1')
      .fromTo(one('.dc-scene--host .dc-qr'), { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 0.3, ease: 'back.out(2)' }, '<')
      .fromTo(q('.dc-scene--host .dc-qr-cell'),
        { opacity: 0 }, { opacity: 1, duration: 0.15, stagger: { each: 0.015, from: 'random' } }, '<');

    // ---------- Stage 2: JOIN ----------
    tl.addLabel('join', '>+0.6')
      .call(() => this.activeStage.set('join'), [], 'join')
      .to(one('[data-progress="join"]'), { scaleX: 1, duration: 4.2, ease: 'none' }, 'join')
      // Phone A scans the QR code
      .fromTo(one('.dc-scanline'), { top: '0%' }, { top: '100%', duration: 0.8, ease: 'sine.inOut', yoyo: true, repeat: 1 }, 'join+=0.2')
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
  }
}
