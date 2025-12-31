
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
});
