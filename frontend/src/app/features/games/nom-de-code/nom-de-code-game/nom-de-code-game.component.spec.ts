import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NomDeCodeGameComponent } from './nom-de-code-game.component';

describe('NomDeCodeGameComponent', () => {
    let component: NomDeCodeGameComponent;
    let fixture: ComponentFixture<NomDeCodeGameComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [NomDeCodeGameComponent]
        })
            .compileComponents();

        fixture = TestBed.createComponent(NomDeCodeGameComponent);
        component = fixture.componentInstance;
        component.room = { roundNumber: 1, players: [], gameData: { currentTeam: 'Red', phase: 'Thinking' } };
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
