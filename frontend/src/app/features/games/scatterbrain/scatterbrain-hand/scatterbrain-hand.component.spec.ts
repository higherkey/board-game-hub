import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ScatterbrainHandComponent } from './scatterbrain-hand.component';
import { SignalRService, Room } from '../../../../services/signalr.service';
import { FormsModule } from '@angular/forms';

describe('ScatterbrainHandComponent', () => {
  let component: ScatterbrainHandComponent;
  let fixture: ComponentFixture<ScatterbrainHandComponent>;
  let signalRMock: any;

  function createMockRoom(): Room {
    return {
      code: 'TEST',
      players: [{ connectionId: 'p1', name: 'Tester', isHost: true, isReady: true, isScreen: false, score: 0 }],
      state: 'Lobby',
      gameType: 'Scatterbrain',
      settings: { timerDurationSeconds: 60, letterMode: 0, boardSize: 4 },
      gameState: {},
      gameData: {
        phase: 0,
        currentLetter: 'S',
        categories: ['City', 'Food', 'Animal']
      },
      playerAnswers: {
        'p1': ['Seattle', 'Soup', 'Snake']
      },
      roundNumber: 1,
      isPaused: false,
      nextGameVotes: {},
      roundScores: {},
      undoSettings: { allowVoting: true, hostOnly: false },
      currentVote: null
    };
  }

  beforeEach(async () => {
    signalRMock = {
      submitAnswers: jasmine.createSpy('submitAnswers'),
      sendGameAction: jasmine.createSpy('sendGameAction'),
      pauseGame: jasmine.createSpy('pauseGame'),
      resumeGame: jasmine.createSpy('resumeGame'),
      endRound: jasmine.createSpy('endRound')
    };

    await TestBed.configureTestingModule({
      imports: [ScatterbrainHandComponent, FormsModule],
      providers: [
        { provide: SignalRService, useValue: signalRMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ScatterbrainHandComponent);
    component = fixture.componentInstance;
    component.room = createMockRoom();
    component.myConnectionId = 'p1';
    fixture.detectChanges();
  });

  it('should create ScatterbrainHandComponent', () => {
    expect(component).toBeTruthy();
  });

  it('should map phase numbers and names correctly', () => {
    component.room!.gameData = { phase: 0 };
    expect(component.phase).toBe('Writing');

    component.room!.gameData = { phase: 1 };
    expect(component.phase).toBe('Validation');

    component.room!.gameData = { phase: 2 };
    expect(component.phase).toBe('Result');
  });

  it('should re-initialize answers on round change in ngOnChanges', () => {
    const prevRoom = createMockRoom();
    const nextRoom: Room = {
      ...createMockRoom(),
      roundNumber: 2,
      gameData: { phase: 0, currentLetter: 'A', categories: ['Car', 'Color'] },
      playerAnswers: {}
    };

    component.room = nextRoom;
    component.ngOnChanges({
      room: {
        currentValue: nextRoom,
        previousValue: prevRoom,
        firstChange: false,
        isFirstChange: () => false
      }
    });

    expect(component.answers.length).toBe(2);
    expect(component.answers[0]).toBe('');
  });

  it('should initialize answers from existing player answers if available', () => {
    expect(component.answers.length).toBe(3);
    expect(component.answers[0]).toBe('Seattle');
  });

  it('should submit answers via SignalRService', () => {
    component.submitAnswers();
    expect(signalRMock.submitAnswers).toHaveBeenCalledWith(['Seattle', 'Soup', 'Snake']);
  });

  it('should dispatch voteChallenge via SignalRService and check hasVoted', () => {
    component.room!.gameData = {
      activeChallenge: {
        votes: { 'p1': true }
      }
    };
    expect(component.hasVoted()).toBeTrue();

    component.voteChallenge(true);
    expect(signalRMock.sendGameAction).toHaveBeenCalledWith('VOTE_WORD', { approve: true });
  });

  it('should allow host actions when isHost is true', () => {
    component.isHost = true;
    component.pauseGame();
    expect(signalRMock.pauseGame).toHaveBeenCalled();

    component.resumeGame();
    expect(signalRMock.resumeGame).toHaveBeenCalled();

    component.endRound();
    expect(signalRMock.endRound).toHaveBeenCalled();
  });
});
