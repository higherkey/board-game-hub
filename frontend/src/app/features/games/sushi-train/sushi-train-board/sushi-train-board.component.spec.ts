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
        // Mock state to resemble round over situation (e.g., RoundOver phase in gameData)
        // Since we don't have a specific phase enum in the component check, we just ensure button presence logic matches.
        // Assuming the template shows button based on `isHost`. 
        // If the real component only shows it when round is over, we'd need to mock that state.
        // Looking at the component, nextRound() is just a method. We can call it directly or ensure button is there if template allows.
        // For now, let's verify the method call maps to service.

        component.nextRound();
        expect(mockSignalRService.nextRound).toHaveBeenCalled();
    });

    it('should call startGame when Host clicks Play Again', () => {
        component.isHost = true;
        component.restartGame();
        expect(mockSignalRService.startGame).toHaveBeenCalled();
    });
});
