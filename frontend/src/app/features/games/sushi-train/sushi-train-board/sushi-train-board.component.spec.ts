import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SushiTrainBoardComponent } from './sushi-train-board.component';
import { SignalRService } from '../../../../services/signalr.service';
import { createMockRoom } from '../../../../shared/testing/test-helpers';
import { CommonModule } from '@angular/common';

describe('SushiTrainBoardComponent', () => {
    let component: SushiTrainBoardComponent;
    let fixture: ComponentFixture<SushiTrainBoardComponent>;
    let mockSignalRService: any;

    beforeEach(async () => {
        mockSignalRService = {
            nextRound: jasmine.createSpy('nextRound'),
            startGame: jasmine.createSpy('startGame')
        };

        await TestBed.configureTestingModule({
            imports: [SushiTrainBoardComponent, CommonModule],
            providers: [
                { provide: SignalRService, useValue: mockSignalRService }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(SushiTrainBoardComponent);
        component = fixture.componentInstance;
        component.room = createMockRoom({ gameType: 'SushiTrain' });
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should call nextRound when Host clicks Next Round', () => {
        component.isHost = true;
        component.isRoundOver = true; // Simulate round over
        fixture.detectChanges();

        const btn = fixture.nativeElement.querySelector('button.btn-primary');
        expect(btn).toBeTruthy();
        expect(btn.textContent).toContain('Next Round');

        btn.click();
        expect(mockSignalRService.nextRound).toHaveBeenCalled();
    });

    it('should call startGame when Host clicks Play Again', () => {
        component.isHost = true;
        component.isGameOver = true; // Simulate game over
        fixture.detectChanges();

        const btn = fixture.nativeElement.querySelector('button.btn-success');
        expect(btn).toBeTruthy();
        expect(btn.textContent).toContain('Play Again');

        btn.click();
        expect(mockSignalRService.startGame).toHaveBeenCalled();
    });
});
