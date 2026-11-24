import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FarkleHandComponent, FarklePhase } from './farkle-hand';
import { SignalRService } from '../../../../services/signalr.service';
import { CommonModule } from '@angular/common';
import { GameChromeService } from '../../../game-room/services/game-chrome.service';

describe('FarkleHandComponent', () => {
  let component: FarkleHandComponent;
  let fixture: ComponentFixture<FarkleHandComponent>;
  let mockSignalRService: jasmine.SpyObj<SignalRService>;

  beforeEach(async () => {
    mockSignalRService = jasmine.createSpyObj('SignalRService', ['sendGameAction']);

    await TestBed.configureTestingModule({
      imports: [FarkleHandComponent, CommonModule],
      providers: [
        { provide: SignalRService, useValue: mockSignalRService },
        GameChromeService
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(FarkleHandComponent);
    component = fixture.componentInstance;
    
    // Mock standard platform inputs
    component.room = {
      code: 'TEST',
      players: [],
      state: 'Playing',
      gameType: 'Farkle',
      settings: { timerDurationSeconds: 0, letterMode: 0 },
      gameData: {
        activePlayerId: 'p1',
        currentTurnScore: 250,
        dice: [
          { value: 1, isHeld: false, isReserved: true, isScoring: true },
          { value: 5, isHeld: false, isReserved: false, isScoring: true },
          { value: 2, isHeld: false, isReserved: false, isScoring: false },
          { value: 3, isHeld: false, isReserved: false, isScoring: false },
          { value: 4, isHeld: false, isReserved: false, isScoring: false },
          { value: 6, isHeld: false, isReserved: false, isScoring: false }
        ],
        phase: FarklePhase.Picking,
        playerStates: {
          'p1': { playerId: 'p1', playerName: 'Player 1', totalScore: 1000, lastTurnScore: 0, isFinalTurn: false }
        }
      },
      roundNumber: 1,
      isPaused: false,
      roundScores: {},
      nextGameVotes: {},
      undoSettings: { allowVoting: true, hostOnly: false }
    } as any;
    component.myConnectionId = 'p1';
    
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call roll action', () => {
    component.roll();
    expect(mockSignalRService.sendGameAction).toHaveBeenCalledWith('ROLL', {});
  });

  it('should call bank action', () => {
    component.bank();
    expect(mockSignalRService.sendGameAction).toHaveBeenCalledWith('BANK', {});
  });

  it('should call toggleDie action', () => {
    component.toggleDie(2);
    expect(mockSignalRService.sendGameAction).toHaveBeenCalledWith('TOGGLE_DIE', { index: 2 });
  });

  it('should correctly count dice for roll label', () => {
    // 1 is reserved, so 5 dice remaining to roll
    expect(component.getRollCount()).toBe(5);
  });

  it("publishes my turn, the turn score and the rules to the room chrome", () => {
    fixture.componentRef.setInput("room", { ...component.room });
    fixture.detectChanges();
    const chrome = TestBed.inject(GameChromeService);
    expect(chrome.status()).toBe("Your turn");
    expect(chrome.progress()).toBe("Turn score 250");
    expect(chrome.scores()!).toHaveSize(1);
    expect(chrome.rules()).not.toBeNull();
    expect(chrome.ended()).toBeFalse();
    fixture.componentRef.setInput("room", { ...component.room, gameData: { ...component.room.gameData, phase: FarklePhase.GameOver, winningPlayerId: "p1" } });
    fixture.detectChanges();
    expect(chrome.ended()).toBeTrue();
  });

  it("keeps everyone's scores under my dice", () => {
    expect(fixture.nativeElement.querySelector(".farkle-hand-scores app-tableau-ring")!.textContent).toContain("Player 1");
  });

  it("leaves status, rules and waiting text to the room chrome, and docks Roll and Bank", () => {
    const el: HTMLElement = fixture.nativeElement;
    for (const gone of [".status-bar", ".rules-btn", ".scoring-aid-overlay", ".not-my-turn"]) expect(el.querySelector(gone)).withContext(gone).toBeNull();
    const dock = el.querySelector("app-action-dock")!;
    expect(dock.textContent).toContain("Roll");
    expect(dock.textContent).toContain("Bank");
  });

  it('should group dice correctly for kept vs reroll', () => {
    const keeping = component.getGroupedDice('keeping');
    const reroll = component.getGroupedDice('reroll');
    
    expect(keeping.length).toBe(1); // The reserved one
    expect(reroll.length).toBe(5);
  });
});
