import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WarshipsGameComponent } from './warships-game.component';

describe('WarshipsGameComponent', () => {
    let component: WarshipsGameComponent;
    let fixture: ComponentFixture<WarshipsGameComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [WarshipsGameComponent]
        })
            .compileComponents();

        fixture = TestBed.createComponent(WarshipsGameComponent);
        component = fixture.componentInstance;
        component.room = { roundNumber: 1, players: [], gameData: { phase: 'Setup' } };
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
