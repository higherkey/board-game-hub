import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GameBarComponent } from './game-bar.component';

describe('GameBarComponent', () => {
    let fixture: ComponentFixture<GameBarComponent>;
    let el: HTMLElement;
    const set = (inputs: Record<string, unknown>) => {
        for (const [k, v] of Object.entries(inputs)) fixture.componentRef.setInput(k, v);
        fixture.detectChanges();
    };

    beforeEach(() => {
        fixture = TestBed.createComponent(GameBarComponent);
        el = fixture.nativeElement;
        set({ gameName: 'Farkle', status: 'Your turn' });
    });

    it('announces the status politely, with the game name', () => {
        const status = el.querySelector('[role=status]')!;
        expect(status.getAttribute('aria-live')).toBe('polite');
        expect(status.textContent).toContain('Your turn');
        expect(el.textContent).toContain('Farkle');
    });

    it('shows progress only when set', () => {
        expect(el.querySelector('.game-bar-progress')).toBeNull();
        set({ progress: 'Turn 3 of 13' });
        expect(el.querySelector('.game-bar-progress')!.textContent).toContain('Turn 3 of 13');
    });

    it('shows the clock unless idle, urgent when running out', () => {
        expect(el.querySelector('[role=timer]')).toBeNull();
        set({ clock: { state: 'idle', text: '', urgent: false } });
        expect(el.querySelector('[role=timer]')).toBeNull();
        set({ clock: { state: 'running', text: '00:09', urgent: true } });
        const timer = el.querySelector('[role=timer]')!;
        expect(timer.textContent).toContain('00:09');
        expect(timer.classList).toContain('is-urgent');
    });

    it('offers How to play only when the game has rules', () => {
        expect(el.querySelector('[aria-label="How to play"]')).toBeNull();
        set({ hasRules: true });
        let opened = false;
        fixture.componentInstance.rulesOpen.subscribe(() => opened = true);
        (el.querySelector('[aria-label="How to play"]') as HTMLButtonElement).click();
        expect(opened).toBeTrue();
    });

    it('opens the game menu from its button', () => {
        let opened = false;
        fixture.componentInstance.menuOpen.subscribe(() => opened = true);
        const btn = el.querySelector('[aria-label="Game menu"]') as HTMLButtonElement;
        expect(btn.getAttribute('aria-haspopup')).toBe('dialog');
        btn.click();
        expect(opened).toBeTrue();
    });
});
