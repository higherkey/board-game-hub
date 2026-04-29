import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FarkleTableComponent } from './farkle-table';
import { CommonModule } from '@angular/common';

describe('FarkleTableComponent', () => {
  let component: FarkleTableComponent;
  let fixture: ComponentFixture<FarkleTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FarkleTableComponent, CommonModule]
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

  it('should return a sorted list of players', () => {
    const playerStates = {
      'p1': { playerId: 'p1', playerName: 'Alice', totalScore: 1000, lastTurnScore: 0 },
      'p2': { playerId: 'p2', playerName: 'Bob', totalScore: 2000, lastTurnScore: 0 }
    } as any;
    
    const sorted = component.getPlayerList(playerStates);
    expect(sorted[0].playerName).toBe('Bob');
    expect(sorted[1].playerName).toBe('Alice');
  });

  it('should generate correct number of pips', () => {
    const pips = component.getPips(5);
    expect(pips.length).toBe(5);
  });
});
