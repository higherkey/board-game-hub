import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ScatterbrainComponent } from './scatterbrain.component';
import { SignalRService } from '../../../../services/signalr.service';
import { FormsModule } from '@angular/forms';

describe('ScatterbrainComponent', () => {
    let component: ScatterbrainComponent;
    let fixture: ComponentFixture<ScatterbrainComponent>;
    let mockSignalRService: any;

    beforeEach(async () => {
        mockSignalRService = {
            nextRound: jasmine.createSpy('nextRound'),
            playAgain: jasmine.createSpy('playAgain'),
            startGame: jasmine.createSpy('startGame'),
            sendGameAction: jasmine.createSpy('sendGameAction')
        };

        await TestBed.configureTestingModule({
            imports: [ScatterbrainComponent, FormsModule],
            providers: [
                { provide: SignalRService, useValue: mockSignalRService }
            ]
        })
            .compileComponents();

        fixture = TestBed.createComponent(ScatterbrainComponent);
        component = fixture.componentInstance;

        // Mock Input
        component.room = {
            code: 'TEST',
            players: [],
            state: 'Playing',
            settings: { timerDurationSeconds: 60, letterMode: 0 },
            gameType: 'Scatterbrain',
            gameState: {},
            gameData: { phase: 0, categories: [] },
            roundNumber: 1,
            isPaused: false,
            roundScores: {},
            nextGameVotes: {},
            currentVote: null,
            undoSettings: { allowVoting: true, hostOnly: false }
        };

        fixture.detectChanges();
    });

    it('keeps internal validation continuation within the game', () => {
        component.isHost = true;
        component.room.gameData.phase = 'Validation';
        component.nextPhase();
        expect(mockSignalRService.sendGameAction).toHaveBeenCalledWith('NEXT_PHASE', {});
        expect(mockSignalRService.nextRound).not.toHaveBeenCalled();
    });

    for (const resultPhase of ['RoundResults', 'GameOver', null, undefined] as const) {
        it('continues result phase ' + resultPhase + ' with its matching action', () => {
            component.isHost = true;
            component.room.state = 'Finished';
            component.room.gameData.phase = 'Result';
            component.room.resultPhase = resultPhase;
            component.nextPhase();
            const expected = resultPhase === 'RoundResults' ? mockSignalRService.nextRound
                : resultPhase === 'GameOver' ? mockSignalRService.playAgain : mockSignalRService.startGame;
            expect(expected).toHaveBeenCalled();
            expect(mockSignalRService.sendGameAction).not.toHaveBeenCalled();
        });
    }

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
