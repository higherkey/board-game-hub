import { ComponentFixture, TestBed, fakeAsync, tick, discardPeriodicTasks } from '@angular/core/testing';
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
            endRound: jasmine.createSpy('endRound').and.returnValue(Promise.resolve()),
            nextRound: jasmine.createSpy('nextRound'),
            pauseGame: jasmine.createSpy('pauseGame'),
            resumeGame: jasmine.createSpy('resumeGame'),
            sendGameAction: jasmine.createSpy('sendGameAction')
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
            settings: { timerDurationSeconds: 60, letterMode: 0, boardSize: 4 },
            gameData: {
                grid: 'ABCDEFGHIJKLMNOP'
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

        component.ngOnChanges({
            room: {
                previousValue: null,
                currentValue: component.room,
                firstChange: true,
                isFirstChange: () => true
            }
        });

        expect(component.isBlurred).toBeTrue();
    });

    it('should NOT show timer text during countdown', fakeAsync(() => {
        component.countdownSeconds = 3;
        component.room = createMockRoom({
            gameType: 'Babble',
            state: 'Playing',
            roundEndTime: new Date(Date.now() + 10000).toISOString()
        });

        component.ngOnChanges({
            room: {
                previousValue: null,
                currentValue: component.room,
                firstChange: true,
                isFirstChange: () => true
            }
        });

        tick(500);
        expect(component.timerText).toBe('--:--');

        component.countdownSeconds = 0;
        tick(500);
        expect(component.timerText).not.toBe('--:--');

        discardPeriodicTasks();
    }));

    describe('Gameplay Interactions', () => {
        it('should submit valid words', () => {
            component.currentWord = 'test';
            component.submitWord();

            expect(mockSignalRService.submitAnswers).toHaveBeenCalledWith(['TEST']);
            expect(component.foundWords).toContain('TEST');
            expect(component.currentWord).toBe('');
        });

        it('should NOT submit short words', () => {
            component.currentWord = 'it';
            component.submitWord();

            expect(mockSignalRService.submitAnswers).not.toHaveBeenCalled();
            expect(component.foundWords.length).toBe(0);
        });

        it('should NOT submit duplicates', () => {
            component.foundWords = ['APPLE'];
            component.currentWord = 'apple';
            component.submitWord();

            expect(mockSignalRService.submitAnswers).not.toHaveBeenCalled();
            expect(component.foundWords.length).toBe(1);
        });
    });

    describe('Host Controls', () => {
        beforeEach(() => {
            component.isHost = true;
            fixture.detectChanges();
        });

        it('should call pauseGame when handlePause is called', () => {
            component.handlePause();
            expect(mockSignalRService.pauseGame).toHaveBeenCalled();
        });

        it('should call resumeGame when handleResume is called', () => {
            component.handleResume();
            expect(mockSignalRService.resumeGame).toHaveBeenCalled();
        });

        it('should call endRound when handleEndRound is called', () => {
            component.handleEndRound();
            expect(mockSignalRService.endRound).toHaveBeenCalled();
            expect(component.isEnding).toBeTrue();
        });

        it('should call nextRound when handleNextRound is called', () => {
            component.handleNextRound();
            expect(mockSignalRService.nextRound).toHaveBeenCalled();
        });
    });

    describe('Results View', () => {
        const mockResults = [
            { word: 'MINE', foundBy: ['conn1'], points: 1 },
            { word: 'OTHER', foundBy: ['conn2'], points: 1 }
        ];

        beforeEach(() => {
            component.lastRoundResults = mockResults;
        });

        it('should filter results when showOnlyMyWords is true', () => {
            component.showOnlyMyWords = true;
            component.isHost = false;
            
            expect(component.displayResults.length).toBe(1);
            expect(component.displayResults[0].word).toBe('MINE');
        });

        it('should NOT filter results when isHost is true', () => {
            component.showOnlyMyWords = true;
            component.isHost = true;
            
            expect(component.displayResults.length).toBe(2);
        });

        it('should correctly identify my words', () => {
            expect(component.isMyWord(mockResults[0])).toBeTrue();
            expect(component.isMyWord(mockResults[1])).toBeFalse();
        });
    });

    describe('Validation', () => {
        it('should send VALIDATE_WORD action', () => {
            component.isHost = true;
            const res = { word: 'TEST', isHostValidated: false };
            
            component.toggleValidation(res, true);
            
            expect(mockSignalRService.sendGameAction).toHaveBeenCalledWith('VALIDATE_WORD', {
                word: 'TEST',
                isValid: true
            });
        });
    });
});
