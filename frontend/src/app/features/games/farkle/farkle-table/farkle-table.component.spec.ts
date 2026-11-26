import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FarkleTableComponent } from './farkle-table';
import { CommonModule } from '@angular/common';
import { GameChromeService } from '../../../game-room/services/game-chrome.service';

describe('FarkleTableComponent', () => {
  let component: FarkleTableComponent;
  let fixture: ComponentFixture<FarkleTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FarkleTableComponent, CommonModule],
      providers: [GameChromeService]
    }).compileComponents();

    fixture = TestBed.createComponent(FarkleTableComponent);
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
        currentTurnScore: 500,
        dice: [
          { value: 1, isHeld: true, isReserved: false },
          { value: 5, isHeld: false, isReserved: true },
          { value: 2, isHeld: false, isReserved: false },
          { value: 3, isHeld: false, isReserved: false },
          { value: 4, isHeld: false, isReserved: false },
          { value: 6, isHeld: false, isReserved: false }
        ],
        phase: 'Picking',
        playerStates: {
          'p1': { playerId: 'p1', playerName: 'Player 1', totalScore: 1000, lastTurnScore: 0 }
        }
      },
      roundNumber: 1,
      isPaused: false,
      roundScores: {},
      nextGameVotes: {},
      undoSettings: { allowVoting: true, hostOnly: false }
    } as any;
    
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should correctly identify the game state', () => {
    expect(component.state).toBeTruthy();
    expect(component.state?.currentTurnScore).toBe(500);
  });

  it('publishes the turn, turn score, scores and rules to the room chrome', () => {
    fixture.componentRef.setInput('room', { ...component.room });
    fixture.detectChanges();
    const chrome = TestBed.inject(GameChromeService);
    expect(chrome.status()).toBe('Player 1’s turn');
    expect(chrome.progress()).toBe('Turn score 500');
    expect(chrome.scores()).toEqual([{ id: 'p1', name: 'Player 1', score: 1000, active: true, isMe: false }]);
    expect(chrome.rules()).not.toBeNull();
  });

  it('leaves the turn heading to the game bar, and shows scores and the scoring guide beside the tray', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.scoreboard-header')).toBeNull();
    expect(el.querySelector('.active-player-name')).toBeNull();
    expect(el.querySelector('app-tableau-ring')!.textContent).toContain('Player 1');
    expect(el.querySelector('app-farkle-rules')!.textContent).toContain('Three 1s');
  });

  it('hands the dice to the tray, keeping banked dice out of throws', () => {
    const dice = (component as any).trayDice([{ value: 3, isHeld: true, isReserved: false }, { value: 5, isHeld: false, isReserved: true }]);
    expect(dice).toEqual([{ value: 3, held: true, locked: true, selected: false }, { value: 5, held: false, locked: false, selected: true }]);
  });
});
