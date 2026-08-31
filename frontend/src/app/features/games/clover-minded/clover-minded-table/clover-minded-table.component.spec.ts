import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CloverMindedTableComponent } from './clover-minded-table.component';
import { SignalRService } from '../../../../services/signalr.service';
import { of } from 'rxjs';

describe('CloverMindedTableComponent', () => {
    let component: CloverMindedTableComponent;
    let fixture: ComponentFixture<CloverMindedTableComponent>;
    let mockSignalRService: jasmine.SpyObj<SignalRService>;

    beforeEach(async () => {
        mockSignalRService = jasmine.createSpyObj('SignalRService', [], {
            cloverCardMoved$: of(null)
        });

        await TestBed.configureTestingModule({
            imports: [CloverMindedTableComponent],
            providers: [
                { provide: SignalRService, useValue: mockSignalRService }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(CloverMindedTableComponent);
        component = fixture.componentInstance;
        component.room = {
            code: 'TEST',
            hostPlayerId: 'p1',
            creatorConnectionId: 'p1',
            players: [
                { connectionId: 'p1', name: 'Host', isScreen: true },
                { connectionId: 'p2', name: 'Alice', isScreen: false }
            ],
            gameType: 'CloverMinded',
            gameStarted: true,
            state: 1,
            gameData: {
                phase: 'Resolution',
                participantIds: ['p2'],
                currentSpectatorId: 'p2',
                currentClues: ['Fruit', 'Animal', 'Tool', 'Color'],
                pool: [
                    { id: 'c1', words: ['Apple', 'Bear', 'Cat', 'Dog'] },
                    { id: 'c2', words: ['Eagle', 'Fish', 'Goat', 'Hawk'] }
                ],
                slots: [
                    { cardId: 'c1', rotation: 0 },
                    { cardId: null, rotation: 0 },
                    { cardId: null, rotation: 0 },
                    { cardId: null, rotation: 0 }
                ]
            }
        } as any;
        fixture.detectChanges();
    });

    it('should create component', () => {
        expect(component).toBeTruthy();
    });

    it('should retrieve slot card by slot index', () => {
        const card = component.getSlotCard(0);
        expect(card).toBeTruthy();
        expect(card?.id).toBe('c1');
    });

    it('should return null for empty slot', () => {
        const card = component.getSlotCard(1);
        expect(card).toBeNull();
    });
});
