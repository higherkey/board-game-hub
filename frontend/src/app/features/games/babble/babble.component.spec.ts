
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BabbleComponent } from './babble.component';
import { SignalRService } from '../../../services/signalr.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { createMockRoom } from '../../../shared/testing/test-helpers';

describe('BabbleComponent', () => {
    let component: BabbleComponent;
    let fixture: ComponentFixture<BabbleComponent>;
    let mockSignalRService: any;

    beforeEach(async () => {
        mockSignalRService = {
            submitAnswers: jasmine.createSpy('submitAnswers'),
            submitClue: jasmine.createSpy('submitClue'),
            submitGuess: jasmine.createSpy('submitGuess')
        };

        await TestBed.configureTestingModule({
            imports: [BabbleComponent, FormsModule, CommonModule],
            providers: [
                { provide: SignalRService, useValue: mockSignalRService }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(BabbleComponent);
        component = fixture.componentInstance;

        // Mock Inputs
        component.room = createMockRoom({
            gameType: 'Babble',
            settings: { timerDurationSeconds: 60, letterMode: 0, boardSize: 4 }, // Specifying boardSize
            gameData: {
                grid: 'ABCDEFGHIJKLMNOP' // 4x4 grid
            }
        });
        component.myConnectionId = 'conn1';

        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
