import { ComponentFixture, TestBed, fakeAsync, tick, discardPeriodicTasks } from '@angular/core/testing';
import { BabbleComponent } from './babble.component';
import { SignalRService } from '../../../../services/signalr.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { createMockRoom } from '../../../../shared/testing/test-helpers';
import { GameChromeService } from '../../../game-room/services/game-chrome.service';

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
                { provide: SignalRService, useValue: mockSignalRService },
                GameChromeService
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

    it('hides the board during the server lead-in, then shows it', fakeAsync(() => {
        component.room = createMockRoom({
            gameType: 'Babble',
            state: 'Playing',
            roundStartTime: new Date(Date.now() + 700).toISOString(),
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
        expect(component.countdownSeconds).toBe(1);

        tick(500); // the server start time has now passed
        expect(component.countdownSeconds).toBe(0);
        expect(component.isBlurred).toBeFalse();

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


    describe("shared chrome", () => {
        it("publishes status, round progress, scores and rules", () => {
            component.room = createMockRoom({ gameType: "Babble", state: "Playing", roundNumber: 2, totalRounds: 5, players: [{ connectionId: "conn1", name: "Ann", score: 4, isHost: false, isReady: true, isScreen: false }], gameData: { grid: "ABCDEFGHIJKLMNOP" } });
            fixture.componentRef.setInput("room", component.room);
            fixture.detectChanges();
            const chrome = TestBed.inject(GameChromeService);
            expect(chrome.status()).toBe("Find words");
            expect(chrome.progress()).toBe("Round 2 of 5");
            expect(chrome.scores()).toEqual([{ id: "conn1", name: "Ann", score: 4, active: false, isMe: true }]);
            expect(chrome.rules()).not.toBeNull();
        });

        it("leaves title, clock, countdown and host controls to the room", () => {
            component.isHost = true;
            fixture.detectChanges();
            const el: HTMLElement = fixture.nativeElement;
            for (const sel of [".babble-header",".babble-mobile-header",".timer-card",".countdown-overlay","app-end-round-button",".results-footer"]) expect(el.querySelector(sel)).withContext(sel).toBeNull();
        });

        it("never ends the round itself when the clock runs out", fakeAsync(() => {
            component.isHost = true;
            component.room = createMockRoom({ gameType: "Babble", state: "Playing", roundEndTime: new Date(Date.now() - 1000).toISOString(), gameData: { grid: "ABCDEFGHIJKLMNOP" } });
            fixture.componentRef.setInput("room", component.room);
            fixture.detectChanges();
            tick(2000);
            expect(mockSignalRService.endRound).not.toHaveBeenCalled();
            discardPeriodicTasks();
        }));
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

        it('should toggle definition display', () => {
            const res = { word: 'TEST' };
            component.showDefinition(res);
            expect(component.selectedWord).toBe(res);
            component.showDefinition(res);
            expect(component.selectedWord).toBeNull();
        });

        it('should handle startResizing and update sidebarWidth', () => {
            const event = new MouseEvent('mousedown');
            spyOn(event, 'preventDefault');
            component.startResizing(event);

            expect(component.isResizing).toBeTrue();
            expect(event.preventDefault).toHaveBeenCalled();

            // Simulate mouse move
            const moveEvent = new MouseEvent('mousemove', { clientX: 200 });
            (component as any).onMouseMove(moveEvent);

            expect(component.sidebarWidth).toBeGreaterThanOrEqual(300);

            // Simulate mouse up
            (component as any).onMouseUp();
            expect(component.isResizing).toBeFalse();
        });
    });
});
