
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DeepfakeGameComponent } from './deepfake-game.component';
import { SignalRService } from '../../../services/signalr.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { createMockRoom } from '../../../shared/testing/test-helpers';

describe('DeepfakeGameComponent', () => {
    let component: DeepfakeGameComponent;
    let fixture: ComponentFixture<DeepfakeGameComponent>;
    let mockSignalRService: any;

    beforeEach(async () => {
        mockSignalRService = {
            getConnectionId: jasmine.createSpy('getConnectionId').and.returnValue('conn1'),
            submitDeepfakeStroke: jasmine.createSpy('submitDeepfakeStroke'),
            submitDeepfakeVote: jasmine.createSpy('submitDeepfakeVote'),
            submitDeepfakeAiGuess: jasmine.createSpy('submitDeepfakeAiGuess'),
            submitDeepfakeAiGuess: jasmine.createSpy('submitDeepfakeAiGuess'),
            nextRound: jasmine.createSpy('nextRound'),
            currentRoom$: { subscribe: () => { } } // Mock observable subscription
        };

        await TestBed.configureTestingModule({
            imports: [DeepfakeGameComponent, FormsModule, CommonModule],
            providers: [
                { provide: SignalRService, useValue: mockSignalRService }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(DeepfakeGameComponent);
        component = fixture.componentInstance;

        // Mock Inputs
        component.room = createMockRoom({
            gameType: 'Deepfake',
            gameData: {
                phase: 0,
                prompt: 'Test Prompt',
                strokes: [],
                playerOrder: [],
                currentTurnIndex: 0,
                votes: {},
                aiCaught: false,
                aiWon: false,
                aiConnectionId: 'conn2'
            }
        });

        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should submit vote when Vote button clicked in Voting phase', () => {
        component.room = createMockRoom({
            gameType: 'Deepfake',
            gameData: { phase: 1, strokes: [], votes: {} }
        });
        fixture.detectChanges();

        component.selectedVoteId = 'conn2'; // Simulate selection
        fixture.detectChanges();

        const btn = fixture.nativeElement.querySelector('button.primary-btn'); // Assuming Vote button class
        btn.click();

        expect(mockSignalRService.submitDeepfakeVote).toHaveBeenCalledWith('conn2');
    });

    it('should call nextRound when Host clicks Next Round in Result phase', () => {
        component.room = createMockRoom({
            gameType: 'Deepfake',
            gameData: { phase: 2, strokes: [], votes: {} }
        });
        // Make sure current player is Host
        const me = component.room.players.find((p: any) => p.connectionId === 'conn1');
        if (me) me.isHost = true;

        fixture.detectChanges();

        const buttons = Array.from(fixture.nativeElement.querySelectorAll('button')) as HTMLButtonElement[];
        const nextRoundBtn = buttons.find(b => b.textContent?.includes('Next Round'));

        expect(nextRoundBtn).toBeTruthy();
        nextRoundBtn?.click();
        expect(mockSignalRService.nextRound).toHaveBeenCalled();
    });
});
});
