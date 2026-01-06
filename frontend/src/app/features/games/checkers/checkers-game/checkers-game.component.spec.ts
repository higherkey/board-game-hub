import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CheckersGameComponent } from './checkers-game.component';

describe('CheckersGameComponent', () => {
    let component: CheckersGameComponent;
    let fixture: ComponentFixture<CheckersGameComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [CheckersGameComponent]
        })
            .compileComponents();

        fixture = TestBed.createComponent(CheckersGameComponent);
        component = fixture.componentInstance;
        component.room = { roundNumber: 1, players: [], gameData: { phase: 'Playing' } };
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
