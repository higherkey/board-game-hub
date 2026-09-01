
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WisecrackPlayerComponent } from './wisecrack-player.component';
import { SignalRService } from '../../../../services/signalr.service';
import { createMockRoom } from '../../../../shared/testing/test-helpers';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

describe('WisecrackPlayerComponent', () => {
    let component: WisecrackPlayerComponent;
    let fixture: ComponentFixture<WisecrackPlayerComponent>;
    let mockSignalRService: any;

    beforeEach(async () => {
        mockSignalRService = {
            submitWisecrackAnswer: jasmine.createSpy('submitWisecrackAnswer'),
            submitWisecrackVote: jasmine.createSpy('submitWisecrackVote'),
            pauseGame: jasmine.createSpy('pauseGame'),
            resumeGame: jasmine.createSpy('resumeGame'),
            endRound: jasmine.createSpy('endRound')
        };

        await TestBed.configureTestingModule({
            imports: [WisecrackPlayerComponent, FormsModule, CommonModule],
            providers: [
                { provide: SignalRService, useValue: mockSignalRService }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(WisecrackPlayerComponent);
        component = fixture.componentInstance;

        // Mock Inputs using Helper
        component.room = createMockRoom({
            gameType: 'Wisecrack',
            gameData: {
                phase: 'WRITING',
                prompts: {},
                answers: {}
            }
        });
        component.playerId = 'conn1';

        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should bind myConnectionId via playerId setter', () => {
        component.playerId = 'conn99';
        expect(component.myId).toBe('conn99');
    });

    it('should evaluate phase getters correctly', () => {
        component.room!.gameData = { phase: 'Writing' };
        expect(component.isWriting).toBeTrue();
        expect(component.isBattling).toBeFalse();
        expect(component.isResult).toBeFalse();

        component.room!.gameData = { phase: 'Battling' };
        expect(component.isWriting).toBeFalse();
        expect(component.isBattling).toBeTrue();

        component.room!.gameData = { phase: 'Result' };
        expect(component.isResult).toBeTrue();
    });

    it('should filter assignments and check answers', () => {
        component.myConnectionId = 'p1';
        component.room!.gameData = {
            assignments: [
                { promptId: 'pr1', text: 'Prompt 1', assignedPlayerIds: ['p1', 'p2'] },
                { promptId: 'pr2', text: 'Prompt 2', assignedPlayerIds: ['p3', 'p4'] }
            ],
            answers: [
                { promptId: 'pr1', playerId: 'p1', answer: 'Joke' }
            ]
        };

        expect(component.myAssignments.length).toBe(1);
        expect(component.myAssignments[0].promptId).toBe('pr1');
        expect(component.hasAnswered('pr1')).toBeTrue();
        expect(component.hasAnswered('pr2')).toBeFalse();
        expect(component.allAnswered).toBeTrue();
    });

    it('should submit answer via SignalRService only when value is present', () => {
        component.inputs['prompt-1'] = '';
        component.submitAnswer('prompt-1');
        expect(mockSignalRService.submitWisecrackAnswer).not.toHaveBeenCalled();

        component.inputs['prompt-1'] = 'Hilarious joke';
        component.submitAnswer('prompt-1');
        expect(mockSignalRService.submitWisecrackAnswer).toHaveBeenCalledWith('prompt-1', 'Hilarious joke');
    });

    it('should calculate voting eligibility and vote state correctly', () => {
        component.myConnectionId = 'voter1';
        component.room!.gameData = {
            currentBattleIndex: 0,
            battles: [
                {
                    answerA: { playerId: 'authorA' },
                    answerB: { playerId: 'authorB' },
                    isFinished: false,
                    votes: [{ playerId: 'otherVoter', choice: 0 }]
                }
            ]
        };

        expect(component.canVote).toBeTrue();
        expect(component.hasVoted).toBeFalse();

        // If user is authorA, cannot vote
        component.myConnectionId = 'authorA';
        expect(component.canVote).toBeFalse();

        // If battle finished, cannot vote
        component.myConnectionId = 'voter1';
        component.room!.gameData.battles[0].isFinished = true;
        expect(component.canVote).toBeFalse();

        // If user voted
        component.room!.gameData.battles[0].votes.push({ playerId: 'voter1', choice: 0 });
        expect(component.hasVoted).toBeTrue();
    });

    it('should submit vote via SignalRService', () => {
        component.vote(0);
        expect(component.votedChoice).toBe(0);
        expect(mockSignalRService.submitWisecrackVote).toHaveBeenCalledWith(0);
    });

    it('should execute host administrative controls', () => {
        component.pauseGame();
        expect(mockSignalRService.pauseGame).toHaveBeenCalled();

        component.resumeGame();
        expect(mockSignalRService.resumeGame).toHaveBeenCalled();

        component.endRound();
        expect(mockSignalRService.endRound).toHaveBeenCalled();
    });
});
