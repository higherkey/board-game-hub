import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FourInARowGameComponent } from './four-in-a-row-game.component';

describe('FourInARowGameComponent', () => {
    let component: FourInARowGameComponent;
    let fixture: ComponentFixture<FourInARowGameComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [FourInARowGameComponent]
        })
            .compileComponents();

        fixture = TestBed.createComponent(FourInARowGameComponent);
        component = fixture.componentInstance;
        component.room = { roundNumber: 1, players: [], gameData: { currentPlayerId: 'P1', phase: 'Thinking' } };
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
