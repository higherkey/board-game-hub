import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CloverMindedHandComponent } from './clover-minded-hand.component';
import { SignalRService } from '../../../../services/signalr.service';

describe('CloverMindedHandComponent', () => {
    let component: CloverMindedHandComponent;
    let fixture: ComponentFixture<CloverMindedHandComponent>;
    let mockSignalRService: jasmine.SpyObj<SignalRService>;

    beforeEach(async () => {
        mockSignalRService = jasmine.createSpyObj('SignalRService', [
            'sendGameAction',
            'cloverDragMove'
        ]);

        await TestBed.configureTestingModule({
            imports: [CloverMindedHandComponent],
            providers: [
                { provide: SignalRService, useValue: mockSignalRService }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(CloverMindedHandComponent);
        component = fixture.componentInstance;
        component.myConnectionId = 'p1';
        component.room = {
            code: 'TEST',
            hostPlayerId: 'p1',
            creatorConnectionId: 'p1',
            players: [],
            gameType: 'CloverMinded',
            gameStarted: true,
            state: 1,
            gameData: {
                phase: 'ClueWriting',
                participantIds: ['p1', 'p2'],
                clueSubmitted: { p1: false, p2: false },
                prepByPlayer: {
                    p1: {
                        connectionId: 'p1',
                        name: 'Alice',
                        cards: [
                            { id: 'c1', words: ['Apple', 'Bear', 'Cat', 'Dog'] },
                            { id: 'c2', words: ['Eagle', 'Fish', 'Goat', 'Hawk'] },
                            { id: 'c3', words: ['Iris', 'Jaguar', 'Kite', 'Lion'] },
                            { id: 'c4', words: ['Moon', 'Night', 'Owl', 'Panda'] }
                        ],
                        slotPermutation: [0, 1, 2, 3],
                        slotRotations: [0, 0, 0, 0],
                        pairWords: [['Apple', 'Eagle'], ['Bear', 'Fish'], ['Cat', 'Goat'], ['Dog', 'Hawk']]
                    }
                }
            }
        } as any;
        fixture.detectChanges();
    });

    it('should create component', () => {
        expect(component).toBeTruthy();
    });

    it('should check if player can submit clues', () => {
        expect(component.canSubmitClues(component.state!)).toBeFalse();
        component.draftClues = ['Clue1', 'Clue2', 'Clue3', 'Clue4'];
        expect(component.canSubmitClues(component.state!)).toBeTrue();
    });

    it('should submit clues when ready', () => {
        component.draftClues = ['Clue1', 'Clue2', 'Clue3', 'Clue4'];
        component.submitClues(component.state!);
        expect(mockSignalRService.sendGameAction).toHaveBeenCalledWith(
            'CLOVER_SUBMIT_CLUES',
            { clues: ['Clue1', 'Clue2', 'Clue3', 'Clue4'] }
        );
    });

    it('should select pool card on click', () => {
        component.selectPoolCard('c1');
        expect(component.selectedCardId).toBe('c1');
        component.selectPoolCard('c1');
        expect(component.selectedCardId).toBeNull();
    });
});
