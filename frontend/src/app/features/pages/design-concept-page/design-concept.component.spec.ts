import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { DesignConceptComponent } from './design-concept.component';

type ObserverCallback = (entries: any[]) => void;

/** Minimal observer stand-in that lets a test fire the callback by hand. */
class FakeObserver {
  static instances: FakeObserver[] = [];
  observed: Element[] = [];
  disconnected = false;
  constructor(public readonly callback: ObserverCallback) {
    FakeObserver.instances.push(this);
  }
  observe(el: Element): void { this.observed.push(el); }
  disconnect(): void { this.disconnected = true; }
}

describe('DesignConceptComponent', () => {
  let fixture: ComponentFixture<DesignConceptComponent>;
  let component: DesignConceptComponent;
  let originalResize: any;
  let originalIntersection: any;

  function setReducedMotion(matches: boolean): void {
    spyOn(globalThis, 'matchMedia').and.returnValue({ matches } as MediaQueryList);
  }

  function create(): void {
    fixture = TestBed.createComponent(DesignConceptComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  const timelineOf = (c: DesignConceptComponent) => (c as any).timeline as gsap.core.Timeline | undefined;

  beforeEach(async () => {
    FakeObserver.instances = [];
    originalResize = (globalThis as any).ResizeObserver;
    originalIntersection = (globalThis as any).IntersectionObserver;
    (globalThis as any).ResizeObserver = class extends FakeObserver {};
    (globalThis as any).IntersectionObserver = class extends FakeObserver {};

    await TestBed.configureTestingModule({
      imports: [DesignConceptComponent],
      providers: [provideRouter([])]
    }).compileComponents();
  });

  afterEach(() => {
    fixture?.destroy();
    (globalThis as any).ResizeObserver = originalResize;
    (globalThis as any).IntersectionObserver = originalIntersection;
  });

  it('renders all three stages with captions', () => {
    setReducedMotion(false);
    create();
    const el: HTMLElement = fixture.nativeElement;
    const titles = Array.from(el.querySelectorAll('.dc-caption-title')).map(t => t.textContent?.trim());
    expect(titles).toEqual(['Host', 'Join', 'Play']);
    expect(el.querySelectorAll('.dc-qr-cell').length).toBe(component.qrCells.length * 2);
    expect(el.querySelectorAll('.dc-card--chosen').length).toBe(2);
  });

  describe('with reduced motion', () => {
    beforeEach(() => {
      setReducedMotion(true);
      create();
    });

    it('shows the static end state and builds no timeline', () => {
      expect(component.isStatic()).toBeTrue();
      expect(timelineOf(component)).toBeUndefined();
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      expect(el.querySelector('.dc-hero')?.classList).toContain('dc-static');
      expect(el.querySelector('.dc-pause')).toBeNull();
    });

    it('ignores pause and jump requests', () => {
      component.togglePause();
      component.jumpTo('play');
      expect(component.isPaused()).toBeFalse();
      expect(component.activeStage()).toBe('host');
    });
  });

  describe('with motion', () => {
    beforeEach(fakeAsync(() => {
      setReducedMotion(false);
      create();
      tick(50); // let the requestAnimationFrame build the timeline
    }));

    it('builds a looping timeline with a label per stage', () => {
      const tl = timelineOf(component)!;
      expect(tl).toBeDefined();
      expect(tl.repeat()).toBe(-1);
      expect(Object.keys(tl.labels)).toEqual(['host', 'join', 'play']);
      expect(component.isStatic()).toBeFalse();
    });

    it('jumps to a stage and marks it active', () => {
      component.jumpTo('play');
      expect(component.activeStage()).toBe('play');
      expect(timelineOf(component)!.time()).toBeCloseTo(timelineOf(component)!.labels['play'], 3);
      fixture.detectChanges();
      const active = fixture.nativeElement.querySelector('.dc-stage.is-active .dc-caption-title');
      expect(active.textContent.trim()).toBe('Play');
    });

    it('toggles pause on and off', () => {
      const tl = timelineOf(component)!;
      component.togglePause();
      expect(component.isPaused()).toBeTrue();
      expect(tl.paused()).toBeTrue();
      component.togglePause();
      expect(component.isPaused()).toBeFalse();
      expect(tl.paused()).toBeFalse();
    });

    it('pauses while offscreen and resumes when visible', () => {
      const intersection = FakeObserver.instances.find(o => o.observed.length && o.callback.toString().includes('isIntersecting'))!;
      const tl = timelineOf(component)!;
      intersection.callback([{ isIntersecting: false }]);
      expect(tl.paused()).toBeTrue();
      intersection.callback([{ isIntersecting: true }]);
      expect(tl.paused()).toBeFalse();
    });

    it('rebuilds the timeline when the width changes, keeping its position', fakeAsync(() => {
      const resize = FakeObserver.instances.find(o => o.callback.toString().includes('contentRect'))!;
      const before = timelineOf(component)!;
      before.seek(5);

      resize.callback([{ contentRect: { width: (component as any).lastWidth } }]);
      tick(250);
      expect(timelineOf(component)).toBe(before); // same width: no rebuild

      resize.callback([{ contentRect: { width: (component as any).lastWidth + 120 } }]);
      tick(250);
      const after = timelineOf(component)!;
      expect(after).not.toBe(before);
      expect(after.time()).toBeCloseTo(5, 3);
    }));

    it('disconnects observers and reverts the timeline on destroy', () => {
      const tl = timelineOf(component)!;
      spyOn(tl, 'revert').and.callThrough();
      fixture.destroy();
      expect(tl.revert).toHaveBeenCalled();
      expect(FakeObserver.instances.every(o => o.disconnected)).toBeTrue();
    });
  });

  it('returns a neutral flight path when an element is missing', () => {
    setReducedMotion(true);
    create();
    expect((component as any).flightPath(null, document.body)).toEqual({ x: 0, y: 0, scale: 1 });
  });
});
