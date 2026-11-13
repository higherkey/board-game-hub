import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { HomeHeroComponent } from './home-hero.component';

type ObserverCallback = (entries: any[]) => void;

class FakeMotionQuery extends EventTarget {
  constructor(public matches: boolean) { super(); }

  change(matches: boolean): void {
    this.matches = matches;
    this.dispatchEvent(new MediaQueryListEvent('change', { matches }));
  }
}

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

describe('HomeHeroComponent', () => {
  let fixture: ComponentFixture<HomeHeroComponent>;
  let component: HomeHeroComponent;
  let originalResize: any;
  let originalIntersection: any;

  function setReducedMotion(matches: boolean): FakeMotionQuery {
    const query = new FakeMotionQuery(matches);
    spyOn(globalThis, 'matchMedia').and.returnValue(query as unknown as MediaQueryList);
    return query;
  }

  function create(): void {
    fixture = TestBed.createComponent(HomeHeroComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  const timelineOf = (c: HomeHeroComponent) => (c as any).timeline as gsap.core.Timeline | undefined;

  beforeEach(async () => {
    FakeObserver.instances = [];
    originalResize = (globalThis as any).ResizeObserver;
    originalIntersection = (globalThis as any).IntersectionObserver;
    (globalThis as any).ResizeObserver = class extends FakeObserver {};
    (globalThis as any).IntersectionObserver = class extends FakeObserver {};

    await TestBed.configureTestingModule({
      imports: [HomeHeroComponent],
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

  it('selects the card game with a Bootstrap icon and keeps the cursor above the picker', () => {
    setReducedMotion(true);
    create();
    const el: HTMLElement = fixture.nativeElement;
    const chosen = el.querySelector('.dc-pick--chosen')!;
    const picker = el.querySelector('.dc-picker')!;
    const cursor = el.querySelector('.dc-cursor')!;
    expect(el.querySelectorAll('.dc-pick--chosen').length).toBe(1);
    expect(chosen.querySelector('i.bi')).not.toBeNull();
    expect(chosen.querySelector('i.bi-suit-spade-fill')).not.toBeNull();
    expect(chosen.textContent?.trim()).toBe('');
    expect(el.querySelectorAll('.dc-pick i.bi').length).toBe(component.pickerGames.length);
    expect(cursor.parentElement).toBe(picker.parentElement);
    expect(picker.contains(cursor)).toBeFalse();
    expect(Number(getComputedStyle(cursor).zIndex)).toBeGreaterThan(0);
    expect(getComputedStyle(cursor).pointerEvents).toBe('none');
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
      expect(FakeObserver.instances.length).toBe(0);
      expect(Array.from(el.querySelectorAll<HTMLButtonElement>('.dc-caption')).every(button => button.disabled)).toBeTrue();
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
      const intersection = FakeObserver.instances.find(o => o.callback.toString().includes('isIntersecting'))!;
      intersection.callback([{ isIntersecting: true }]);
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

    it('lets cards travel beyond their phone screens while in flight', () => {
      const tl = timelineOf(component)!;
      tl.pause().seek(tl.labels['play'] + 0.8);
      const el: HTMLElement = fixture.nativeElement;
      const hands = Array.from(el.querySelectorAll<HTMLElement>('.dc-hand'));
      expect(hands.length).toBe(2);
      for (const hand of hands) {
        const style = getComputedStyle(hand);
        expect(style.overflowX).toBe('visible');
        expect(style.overflowY).toBe('visible');
        const phone = hand.closest('.dc-phone')!;
        expect(Number(getComputedStyle(phone).zIndex)).toBeGreaterThan(0);
      }
      expect(el.querySelector<HTMLElement>('.dc-hand--a .dc-card--chosen')!.style.transform).not.toBe('');
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

    it('keeps a manual pause when the hero returns onscreen', () => {
      const intersection = FakeObserver.instances.find(o => o.callback.toString().includes('isIntersecting'))!;
      const tl = timelineOf(component)!;
      component.togglePause();
      intersection.callback([{ isIntersecting: false }]);
      intersection.callback([{ isIntersecting: true }]);
      expect(component.isPaused()).toBeTrue();
      expect(tl.paused()).toBeTrue();
      component.togglePause();
      expect(tl.paused()).toBeFalse();
    });

    it('stays paused offscreen when the user clears the manual pause', () => {
      const intersection = FakeObserver.instances.find(o => o.callback.toString().includes('isIntersecting'))!;
      component.togglePause();
      intersection.callback([{ isIntersecting: false }]);
      component.togglePause();
      expect(component.isPaused()).toBeFalse();
      expect(timelineOf(component)!.paused()).toBeTrue();
      intersection.callback([{ isIntersecting: true }]);
      expect(timelineOf(component)!.paused()).toBeFalse();
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

    it('keeps a manual pause after a resize rebuild', fakeAsync(() => {
      const resize = FakeObserver.instances.find(o => o.callback.toString().includes('contentRect'))!;
      component.togglePause();
      const before = timelineOf(component)!;
      before.seek(5);
      resize.callback([{ contentRect: { width: (component as any).lastWidth + 80 } }]);
      tick(250);
      expect(timelineOf(component)).not.toBe(before);
      expect(timelineOf(component)!.time()).toBeCloseTo(5, 3);
      expect(timelineOf(component)!.paused()).toBeTrue();
      expect(component.isPaused()).toBeTrue();
    }));

    it('cancels a pending resize rebuild on destroy', fakeAsync(() => {
      const resize = FakeObserver.instances.find(o => o.callback.toString().includes('contentRect'))!;
      const rebuild = spyOn(component as any, 'rebuildTimeline').and.callThrough();
      resize.callback([{ contentRect: { width: (component as any).lastWidth + 80 } }]);
      fixture.destroy();
      tick(250);
      expect(rebuild).not.toHaveBeenCalled();
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
    expect((component as any).flightPath(document.body, null)).toEqual({ x: 0, y: 0, scale: 1 });
  });

  it('measures card travel between centers and handles a zero-width origin', () => {
    setReducedMotion(true);
    create();
    const card = document.createElement('span');
    const slot = document.createElement('span');
    const origin = spyOn(card, 'getBoundingClientRect').and.returnValue({ left: 20, top: 30, width: 40, height: 60 } as DOMRect);
    spyOn(slot, 'getBoundingClientRect').and.returnValue({ left: 100, top: 80, width: 20, height: 30 } as DOMRect);
    expect((component as any).flightPath(card, slot)).toEqual({ x: 70, y: 35, scale: 0.5 });
    origin.and.returnValue({ left: 20, top: 30, width: 0, height: 60 } as DOMRect);
    expect((component as any).flightPath(card, slot)).toEqual({ x: 90, y: 35, scale: 1 });
  });

  it('moves the pointer tip to 45 percent of the selected card rather than centering the cursor', () => {
    setReducedMotion(true);
    create();
    const pointer = document.createElement('span');
    const target = document.createElement('span');
    spyOn(pointer, 'getBoundingClientRect').and.returnValue({ left: 100, top: 150, width: 24, height: 30 } as DOMRect);
    spyOn(target, 'getBoundingClientRect').and.returnValue({ left: 20, top: 30, width: 80, height: 60 } as DOMRect);
    expect((component as any).pointerPath(pointer, target)).toEqual({ x: -44, y: -93 });
    expect((component as any).pointerPath(null, target)).toEqual({ x: 0, y: 0 });
    expect((component as any).pointerPath(pointer, null)).toEqual({ x: 0, y: 0 });
  });

  it('waits for visibility before playing the initial timeline', fakeAsync(() => {
    setReducedMotion(false);
    create();
    const intersection = FakeObserver.instances.find(o => o.callback.toString().includes('isIntersecting'))!;
    intersection.callback([{ isIntersecting: false }]);
    tick(50);
    expect(timelineOf(component)!.paused()).toBeTrue();
    intersection.callback([{ isIntersecting: true }]);
    expect(timelineOf(component)!.paused()).toBeFalse();
  }));

  it('plays without browser observer APIs', fakeAsync(() => {
    setReducedMotion(false);
    (globalThis as any).ResizeObserver = undefined;
    (globalThis as any).IntersectionObserver = undefined;
    create();
    tick(50);
    expect(timelineOf(component)).toBeDefined();
    expect(timelineOf(component)!.paused()).toBeFalse();
    expect(FakeObserver.instances.length).toBe(0);
  }));

  it('applies live reduced motion, cancels resize work and restarts once while keeping a manual pause', fakeAsync(() => {
    const query = setReducedMotion(false);
    create();
    tick(50);
    const before = timelineOf(component)!;
    const revert = spyOn(before, 'revert').and.callThrough();
    const build = spyOn(component as any, 'buildTimeline').and.callThrough();
    const oldObservers = [...FakeObserver.instances];
    const resize = oldObservers.find(o => o.callback.toString().includes('contentRect'))!;
    const intersection = oldObservers.find(o => o.callback.toString().includes('isIntersecting'))!;
    intersection.callback([{ isIntersecting: true }]);
    component.togglePause();
    resize.callback([{ contentRect: { width: (component as any).lastWidth + 100 } }]);

    query.change(true);
    fixture.detectChanges();
    expect(component.isStatic()).toBeTrue();
    expect(timelineOf(component)).toBeUndefined();
    expect(revert).toHaveBeenCalledTimes(1);
    expect(oldObservers.every(o => o.disconnected)).toBeTrue();
    expect(fixture.nativeElement.querySelector('.dc-pause')).toBeNull();
    resize.callback([{ contentRect: { width: 900 } }]);
    intersection.callback([{ isIntersecting: true }]);
    tick(250);
    expect(build).not.toHaveBeenCalled();

    query.change(false);
    query.change(false);
    fixture.detectChanges();
    tick(50);
    expect(component.isStatic()).toBeFalse();
    expect(build).toHaveBeenCalledTimes(1);
    expect(timelineOf(component)).toBeDefined();
    expect(timelineOf(component)).not.toBe(before);
    expect(FakeObserver.instances.length).toBe(oldObservers.length + 2);
    const currentIntersection = FakeObserver.instances.filter(o => o.callback.toString().includes('isIntersecting')).at(-1)!;
    currentIntersection.callback([{ isIntersecting: true }]);
    expect(component.isPaused()).toBeTrue();
    expect(timelineOf(component)!.paused()).toBeTrue();
    query.change(false);
    tick(50);
    expect(build).toHaveBeenCalledTimes(1);
  }));

  it('removes the live motion listener and ignores late events after destruction', fakeAsync(() => {
    const query = setReducedMotion(true);
    const add = spyOn(query, 'addEventListener').and.callThrough();
    const remove = spyOn(query, 'removeEventListener').and.callThrough();
    create();
    const build = spyOn(component as any, 'buildTimeline').and.callThrough();
    const listener = add.calls.mostRecent().args[1] as EventListener;
    expect(add.calls.mostRecent().args[0]).toBe('change');
    fixture.destroy();
    expect(remove).toHaveBeenCalledWith('change', listener);
    query.change(false);
    listener(new MediaQueryListEvent('change', { matches: false }));
    tick(50);
    expect(build).not.toHaveBeenCalled();
    expect(timelineOf(component)).toBeUndefined();
    expect(component.isStatic()).toBeTrue();
    expect(FakeObserver.instances.length).toBe(0);
  }));

  it('cancels the initial animation frame when destroyed before layout settles', () => {
    setReducedMotion(false);
    const request = spyOn(globalThis, 'requestAnimationFrame').and.returnValue(123);
    const cancel = spyOn(globalThis, 'cancelAnimationFrame');
    fixture = TestBed.createComponent(HomeHeroComponent);
    component = fixture.componentInstance;
    const build = spyOn(component as any, 'buildTimeline').and.callThrough();
    fixture.detectChanges();
    expect(request).toHaveBeenCalled();
    fixture.destroy();
    expect(cancel).toHaveBeenCalledWith(123);
    expect(build).not.toHaveBeenCalled();
    expect(FakeObserver.instances.every(o => o.disconnected)).toBeTrue();
  });
});
