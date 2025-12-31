
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GameReviewComponent } from './game-review.component';
import { SignalRService } from '../../../../services/signalr.service';
import { CommonModule } from '@angular/common';

describe('GameReviewComponent', () => {
    let component: GameReviewComponent;
    let fixture: ComponentFixture<GameReviewComponent>;
    let mockSignalRService: any;

    beforeEach(async () => {
        mockSignalRService = {
            voteNextGame: jasmine.createSpy('voteNextGame')
        };

        await TestBed.configureTestingModule({
            imports: [GameReviewComponent, CommonModule],
            providers: [
                { provide: SignalRService, useValue: mockSignalRService }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(GameReviewComponent);
        component = fixture.componentInstance;
        component.room = {
            code: 'TEST',
            players: [],
            state: 'Finished',
            settings: { timerDurationSeconds: 60, letterMode: 0 },
            gameType: 'Scatterbrain',
            gameState: {},
            gameData: {},
            roundNumber: 1,
            isPaused: false,
            roundScores: {},
            nextGameVotes: {},
            currentVote: null,
            undoSettings: { allowVoting: true, hostOnly: false }
        };
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
