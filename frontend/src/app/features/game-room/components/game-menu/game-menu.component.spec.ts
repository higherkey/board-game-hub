import { ChangeDetectionStrategy, Component, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GameMenuComponent } from './game-menu.component';
import { TableauEntry } from '../../services/game-chrome.service';

@Component({
    standalone: true,
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [GameMenuComponent],
    template: `<button id="opener" (click)="menu.open()">Menu</button>
        <app-game-menu #menu roomCode="ABCD" [isHost]="isHost" [canUndo]="canUndo" [scores]="scores"
            (leave)="events.push('leave')" (players)="events.push('players')" (rules)="events.push('rules')">
            <div menuHost class="host-stuff">Host things</div>
        </app-game-menu>`
})
class HostComponent {
    @ViewChild('menu', { static: true }) menu!: GameMenuComponent;
    isHost = false;
    canUndo = false;
    scores: TableauEntry[] | null = null;
    events: string[] = [];
}

describe('GameMenuComponent', () => {
    let fixture: ComponentFixture<HostComponent>;
    let el: HTMLElement;
    const dialog = () => el.querySelector('dialog') as HTMLDialogElement;
    const button = (label: string) =>
        [...el.querySelectorAll('dialog button')].find(b => b.textContent!.includes(label)) as HTMLButtonElement | undefined;

    beforeEach(() => {
        fixture = TestBed.createComponent(HostComponent);
        el = fixture.nativeElement;
        document.body.appendChild(el);
        fixture.detectChanges();
    });
    afterEach(() => el.remove());

    it('opens as a modal dialog and returns focus to the opener on Escape', () => {
        const opener = el.querySelector('#opener') as HTMLButtonElement;
        opener.focus();
        opener.click();
        expect(dialog().open).toBeTrue();
        dialog().dispatchEvent(new Event('cancel', { cancelable: true }));
        expect(dialog().open).toBeFalse();
        expect(document.activeElement).toBe(opener);
    });

    it('shows the host section only to the host', () => {
        expect(el.querySelector('dialog .host-stuff')).toBeNull();
        fixture.componentInstance.isHost = true;
        fixture.detectChanges();
        expect(el.querySelector('dialog .host-stuff')).not.toBeNull();
        expect([...el.querySelectorAll('dialog h2')].map(h => h.textContent!.trim())).toContain('Host');
    });

    it('lists scores when the game has them', () => {
        expect(el.querySelector('dialog app-tableau-ring')).toBeNull();
        fixture.componentInstance.scores = [{ id: 'a', name: 'Ann', score: 3 }];
        fixture.detectChanges();
        expect(el.querySelector('dialog app-tableau-ring')!.textContent).toContain('Ann');
    });

    it('drops the This game heading when the game has neither rules nor scores', () => {
        fixture.componentInstance.menu.hasRules = false;
        fixture.componentInstance.isHost = true;
        fixture.detectChanges();
        expect([...el.querySelectorAll('dialog h2')].map(h => h.textContent!.trim())).not.toContain('This game');
    });

    it('states sound once, in the label, not also as a toggle state', () => {
        const sound = button('Sound')!;
        expect(sound.textContent).toContain('Sound on');
        expect(sound.hasAttribute('aria-pressed')).toBeFalse();
    });

    it('offers Undo only when allowed', () => {
        expect(button('Undo')).toBeUndefined();
        fixture.componentInstance.canUndo = true;
        fixture.detectChanges();
        expect(button('Undo')).toBeDefined();
    });

    it('closes before emitting leave, players and rules', () => {
        fixture.componentInstance.menu.open();
        button('Leave room')!.click();
        expect(dialog().open).toBeFalse();
        fixture.componentInstance.menu.open();
        button('Players')!.click();
        fixture.componentInstance.menu.open();
        button('How to play')!.click();
        expect(fixture.componentInstance.events).toEqual(['leave', 'players', 'rules']);
    });

    it('shows the room code and has no nested menus', () => {
        expect(dialog().textContent).toContain('ABCD');
        expect(el.querySelectorAll('dialog [role=menu]').length).toBe(0);
        expect(el.querySelectorAll('dialog details').length).toBe(0);
    });
});
