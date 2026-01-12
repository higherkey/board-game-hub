import { ComponentFixture, TestBed, fakeAsync, tick, discardPeriodicTasks } from '@angular/core/testing';
import { SimpleChanges } from '@angular/core';
import { BabbleComponent } from './babble.component';
import { SignalRService } from '../../../../services/signalr.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { createMockRoom } from '../../../../shared/testing/test-helpers';

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

    it('should be blurred when paused', () => {
        component.isBlurred = false;
        component.room = createMockRoom({
            gameType: 'Babble',
            isPaused: true,
            state: 'Playing'
        });

        // Trigger ngOnChanges logic manually if needed, or rely on updateStateFromRoom if called
        // Since updateStateFromRoom is private, we can simulate the effect by calling ngOnChanges or exposing it.
        // However, looking at the code, ngOnChanges calls updateStateFromRoom.

        // Trigger ngOnChanges logic manually
        const changes: any = {
            room: {
                previousValue: null,
                currentValue: component.room,
                firstChange: true,
                isFirstChange: () => true
            }
        };

        component.ngOnChanges(changes);

        expect(component.isBlurred).toBeTrue();
    });

    it('should not show timer text during countdown', fakeAsync(() => {
        component.countdownSeconds = 3;
        component.room = createMockRoom({
            gameType: 'Babble',
            state: 'Playing',
            roundEndTime: new Date(Date.now() + 10000).toISOString()
        });

        // We need to access private startTimer or trigger it via ngOnChanges
        component.ngOnChanges({
            room: {
                previousValue: null,
                currentValue: component.room,
                firstChange: true,
                isFirstChange: () => true
            }
        });

        tick(500); // Advance timer interval

        expect(component.timerText).toBe('--:--');

        component.countdownSeconds = 0;
        tick(500);

        expect(component.timerText).not.toBe('--:--');

        discardPeriodicTasks();
    }));
});
