import { ComponentFixture, TestBed, fakeAsync, tick, discardPeriodicTasks } from '@angular/core/testing';
import { BabbleHandComponent } from './babble-hand.component';
import { SignalRService } from '../../../../services/signalr.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { createMockRoom } from '../../../../shared/testing/test-helpers';
import { GameChromeService } from '../../../game-room/services/game-chrome.service';

describe('BabbleHandComponent', () => {
  let component: BabbleHandComponent;
  let fixture: ComponentFixture<BabbleHandComponent>;
  let mockSignalRService: any;

  beforeEach(async () => {
    mockSignalRService = {
      submitAnswers: jasmine.createSpy('submitAnswers'),
      endRound: jasmine.createSpy('endRound').and.returnValue(Promise.resolve()),
      nextRound: jasmine.createSpy('nextRound'),
      pauseGame: jasmine.createSpy('pauseGame').and.returnValue(Promise.resolve()),
      resumeGame: jasmine.createSpy('resumeGame').and.returnValue(Promise.resolve()),
      sendGameAction: jasmine.createSpy('sendGameAction')
    };

    await TestBed.configureTestingModule({
      imports: [BabbleHandComponent, FormsModule, CommonModule],
      providers: [
        { provide: SignalRService, useValue: mockSignalRService },
        GameChromeService
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(BabbleHandComponent);
    component = fixture.componentInstance;

    component.room = createMockRoom({
      gameType: 'Babble',
      state: 'Playing',
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

  describe('Grid and Letters Parsing', () => {
    it('should parse grid string into characters and board size', () => {
      expect(component.gridChars.length).toBe(16);
      expect(component.boardSize).toBe(4);
      expect(component.gridChars[0]).toBe('A');
    });

    it('should add letter on tile tap', () => {
      component.addLetter('A');
      component.addLetter('B');
      expect(component.currentWord).toBe('AB');
    });

    it('should handle Qu when tapping Q', () => {
      component.addLetter('Q');
      expect(component.currentWord).toBe('QU');
    });

    it('should backspace single letter and QU digraph', () => {
      component.currentWord = 'ABC';
      component.backspace();
      expect(component.currentWord).toBe('AB');

      component.currentWord = 'AQU';
      component.backspace();
      expect(component.currentWord).toBe('A');
    });

    it('should clear current word', () => {
      component.currentWord = 'HELLO';
      component.clearWord();
      expect(component.currentWord).toBe('');
    });
  });

  describe('Word Submission', () => {
    beforeEach(() => {
    });

    it('should submit valid word and clear input', () => {
      component.currentWord = 'apple';
      component.submitWord();

      expect(mockSignalRService.submitAnswers).toHaveBeenCalledWith(['APPLE']);
      expect(component.foundWords).toContain('APPLE');
      expect(component.currentWord).toBe('');
    });

    it('should NOT submit words shorter than 3 letters', () => {
      component.currentWord = 'at';
      component.submitWord();

      expect(mockSignalRService.submitAnswers).not.toHaveBeenCalled();
      expect(component.foundWords.length).toBe(0);
    });

    it('should NOT submit duplicate words', () => {
      component.foundWords = ['APPLE'];
      component.currentWord = 'apple';
      component.submitWord();

      expect(mockSignalRService.submitAnswers).not.toHaveBeenCalled();
      expect(component.foundWords.length).toBe(1);
    });

    it('should NOT submit word when paused or blurred', () => {
      component.room = { ...component.room!, isPaused: true };
      component.currentWord = 'BANANA';
      component.submitWord();

      expect(mockSignalRService.submitAnswers).not.toHaveBeenCalled();
      expect(component.foundWords.length).toBe(0);
    });
  });

  describe('Countdown and Timer', () => {
    const setRoom = (overrides: any) => {
      component.room = createMockRoom({ gameType: 'Babble', state: 'Playing', roundNumber: 2, gameData: { grid: 'ABCDEFGHIJKLMNOP' }, ...overrides });
      component.ngOnChanges({
        room: { previousValue: null, currentValue: component.room, firstChange: false, isFirstChange: () => false }
      });
    };

    it('counts down to the server start time, then shows the board', fakeAsync(() => {
      setRoom({ roundStartTime: new Date(Date.now() + 3000).toISOString(), roundEndTime: new Date(Date.now() + 63000).toISOString() });

      expect(component.isBlurred).toBeTrue();
      expect(component.countdownSeconds).toBe(3);

      tick(3100);
      expect(component.isBlurred).toBeFalse();
      expect(component.countdownSeconds).toBe(0);
      discardPeriodicTasks();
    }));

    it('does not replay the countdown after a refresh once play has started', fakeAsync(() => {
      setRoom({ roundStartTime: new Date(Date.now() - 20000).toISOString(), roundEndTime: new Date(Date.now() + 40000).toISOString() });

      expect(component.countdownSeconds).toBe(0);
      expect(component.isBlurred).toBeFalse();
      discardPeriodicTasks();
    }));

    it('hides the board while paused, without a countdown', fakeAsync(() => {
      setRoom({ isPaused: true, roundStartTime: new Date(Date.now() + 2000).toISOString() });

      expect(component.countdownSeconds).toBe(0);
      expect(component.isBlurred).toBeTrue();
      discardPeriodicTasks();
    }));

  });

  describe('Host word validation on Hand', () => {
    beforeEach(() => {
      component.isHost = true;
      fixture.detectChanges();
    });

    it('should send VALIDATE_WORD action when host toggles validation', () => {
      const res = { word: 'WORD', isHostValidated: false, isInDictionary: true };
      component.toggleValidation(res, true);

      expect(mockSignalRService.sendGameAction).toHaveBeenCalledWith('VALIDATE_WORD', {
        word: 'WORD',
        isValid: true
      });
    });
  });

  describe('Results Phase on Hand', () => {
    const mockResults = [
      { word: 'MINE', foundBy: ['conn1'], points: 2, isOnGrid: true, isInDictionary: true },
      { word: 'OTHER', foundBy: ['conn2'], points: 3, isOnGrid: true, isInDictionary: true }
    ];

    beforeEach(() => {
      component.lastRoundResults = mockResults;
      component.room = createMockRoom({
        gameType: 'Babble',
        state: 'Finished'
      });
    });

    it('should calculate myRoundScore correctly', () => {
      expect(component.myRoundScore).toBe(2);
    });

    it('should filter to only my words when showOnlyMyWords is true (even if host)', () => {
      component.isHost = true;
      component.showOnlyMyWords = true;

      expect(component.displayResults.length).toBe(1);
      expect(component.displayResults[0].word).toBe('MINE');
    });

    it('should show all words when showOnlyMyWords is false', () => {
      component.showOnlyMyWords = false;
      expect(component.displayResults.length).toBe(2);
    });

    it('should toggle definition display', () => {
      const res = mockResults[0];
      component.showDefinition(res);
      expect(component.selectedWord).toBe(res);

      component.showDefinition(res);
      expect(component.selectedWord).toBeNull();
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
          expect(chrome.autoEndRound()).toBeTrue();
      });

      it("leaves title, clock, countdown and host controls to the room", () => {
          component.isHost = true;
          fixture.detectChanges();
          const el: HTMLElement = fixture.nativeElement;
          for (const sel of [".host-toolbar",".hand-header",".timer-card",".countdown-overlay",".game-name",".round-pill"]) expect(el.querySelector(sel)).withContext(sel).toBeNull();
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

  it("docks the word entry in thumb reach", () => {
    expect(fixture.nativeElement.querySelector("app-action-dock form")).not.toBeNull();
  });
});
