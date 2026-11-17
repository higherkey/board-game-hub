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
            sendGameAction: jasmine.createSpy('sendGameAction'),
            playAgain: jasmine.createSpy('playAgain'),
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

    it('leaves native internal rounds to automatic server progression', () => {
        component.isHost = true;
        component.room!.gameData = { isRoundOver: true, isGameOver: false };
        fixture.detectChanges();
        expect(fixture.nativeElement.textContent).not.toContain('Next Round');
        expect(mockSignalRService.sendGameAction).not.toHaveBeenCalled();
    });

    it('uses explicit replay for an authoritative final result', () => {
        component.room!.resultPhase = 'GameOver';
        component.restartGame();
        expect(mockSignalRService.playAgain).toHaveBeenCalled();
        expect(mockSignalRService.startGame).not.toHaveBeenCalled();
    });

    it('should call startGame when Host clicks Play Again', () => {
        component.isHost = true;
        component.restartGame();
        expect(mockSignalRService.startGame).toHaveBeenCalled();
    });
});
