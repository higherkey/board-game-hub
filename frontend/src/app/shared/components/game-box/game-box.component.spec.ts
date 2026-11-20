import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GameBoxComponent, gameBoxArt, gameBoxTheme, playerRange } from './game-box.component';

describe('GameBoxComponent', () => {
    let fixture: ComponentFixture<GameBoxComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({ imports: [GameBoxComponent] }).compileComponents();
        fixture = TestBed.createComponent(GameBoxComponent);
    });

    it('shows the name, the player count and the drawn cover for a known game', () => {
        fixture.componentRef.setInput('game', { id: 'Farkle', name: 'Farkle', minPlayers: 1, maxPlayers: 8 });
        fixture.detectChanges();
        const el: HTMLElement = fixture.nativeElement;
        expect(el.querySelector('.gb-title')?.textContent?.trim()).toBe('Farkle');
        expect(el.querySelector('.gb-meta')?.textContent?.trim()).toBe('1 to 8 players');
        expect(el.querySelector('.gb')?.classList).toContain('gb--t0');
        // Five dice: five squares plus their pips.
        expect(el.querySelectorAll('.gb-cover polygon').length).toBe(5);
    });

    it('gives every other game a stable tangram cover in one of the eight colours', () => {
        const first = gameBoxArt('SushiTrain');
        expect(gameBoxArt('SushiTrain')).toEqual(first);
        expect(first.shapes.length).toBe(7);
        for (const id of ['SushiTrain', 'Wisecrack', 'Spectrum', 'x']) {
            const theme = gameBoxTheme(id);
            expect(theme).toBeGreaterThanOrEqual(0);
            expect(theme).toBeLessThan(8);
            expect(gameBoxArt(id).theme).toBe(theme);
        }
    });

    it('reads the player range plainly', () => {
        expect(playerRange({ minPlayers: 2, maxPlayers: 2 })).toBe('2 players');
        expect(playerRange({ minPlayers: 3, maxPlayers: 6 })).toBe('3 to 6 players');
    });
});
