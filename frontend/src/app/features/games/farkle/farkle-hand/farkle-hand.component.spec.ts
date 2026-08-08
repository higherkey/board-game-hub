import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FarkleHandComponent, FarklePhase } from './farkle-hand';
import { SignalRService } from '../../../../services/signalr.service';
import { CommonModule } from '@angular/common';

describe('FarkleHandComponent', () => {
  let component: FarkleHandComponent;
  let fixture: ComponentFixture<FarkleHandComponent>;
  let mockSignalRService: jasmine.SpyObj<SignalRService>;

  beforeEach(async () => {
    mockSignalRService = jasmine.createSpyObj('SignalRService', ['sendGameAction']);

    await TestBed.configureTestingModule({
      imports: [FarkleHandComponent, CommonModule],
      providers: [
        { provide: SignalRService, useValue: mockSignalRService }
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

  it('should toggle scoring aid visibility', () => {
    expect(component.showScoringAid).toBeFalse();
    component.toggleScoringAid();
    expect(component.showScoringAid).toBeTrue();
  });

  it('should group dice correctly for kept vs reroll', () => {
    const keeping = component.getGroupedDice('keeping');
    const reroll = component.getGroupedDice('reroll');
    
    expect(keeping.length).toBe(1); // The reserved one
    expect(reroll.length).toBe(5);
  });
});
