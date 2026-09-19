import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PictophoneHandComponent } from './pictophone-hand.component';
import { SignalRService, Room } from '../../../../services/signalr.service';

describe('PictophoneHandComponent', () => {
  let component: PictophoneHandComponent;
  let fixture: ComponentFixture<PictophoneHandComponent>;
  let signalRMock: any;

  const mockRoom: Room = {
    code: 'PICT',
    players: [{ connectionId: 'p1', name: 'Tester', isHost: true, isReady: true, isScreen: false, score: 0 }],
    state: 'Lobby',
    gameType: 'Pictophone',
    settings: { timerDurationSeconds: 60, letterMode: 0, boardSize: 4 },
    gameState: {},
    gameData: {
      phase: 'Prompting',
      roundIndex: 0,
      totalRounds: 3,
      books: [
        {
          bookId: 'b1',
          initialAuthorId: 'p1',
          currentHolderId: 'p1',
          pages: []
        }
      ]
    },
    roundNumber: 1,
    isPaused: false,
    nextGameVotes: {},
    roundScores: {},
    undoSettings: { allowVoting: true, hostOnly: false },
    currentVote: null
  };

  beforeEach(async () => {
    signalRMock = {
      submitPictophoneDraft: jasmine.createSpy('submitPictophoneDraft'),
      submitPictophonePage: jasmine.createSpy('submitPictophonePage'),
      revealPictophoneNext: jasmine.createSpy('revealPictophoneNext'),
      starPictophonePage: jasmine.createSpy('starPictophonePage'),
      pauseGame: jasmine.createSpy('pauseGame'),
      resumeGame: jasmine.createSpy('resumeGame'),
      forcePictophoneNext: jasmine.createSpy('forcePictophoneNext')
    };

    await TestBed.configureTestingModule({
      imports: [PictophoneHandComponent],
      providers: [
        { provide: SignalRService, useValue: signalRMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PictophoneHandComponent);
    component = fixture.componentInstance;
    component.room = mockRoom;
    component.myConnectionId = 'p1';
    fixture.detectChanges();
  });

  it('should create PictophoneHandComponent', () => {
    expect(component).toBeTruthy();
  });

  it('should map phase labels correctly', () => {
    expect(component.getPhaseLabel('Prompting')).toBe('Write a Prompt');
    expect(component.getPhaseLabel('Drawing')).toBe('Draw It!');
    expect(component.getPhaseLabel('Guessing')).toBe('What is this?');
    expect(component.getPhaseLabel('Reveal')).toBe('Showcase');
    expect(component.getPhaseLabel('Lobby')).toBe('Lobby');
  });

  it('should get previous page from current holder book', () => {
    const bookWithPages = {
      bookId: 'b1',
      currentHolderId: 'p1',
      pages: [{ type: 'prompt', content: 'A happy cat' }]
    };
    const state = { books: [bookWithPages] };
    const prev = component.getPreviousPage(state);
    expect(prev).toEqual({ type: 'prompt', content: 'A happy cat' });
  });

  it('should submit page content via SignalR', () => {
    component.onSubmit('Test prompt');
    expect(signalRMock.submitPictophonePage).toHaveBeenCalledWith('Test prompt');
  });

  it('should submit draft via SignalR', () => {
    component.onDraftChanged('Drafting...');
    expect(signalRMock.submitPictophoneDraft).toHaveBeenCalledWith('Drafting...');
  });

  it('should dispatch reveal next and star actions', () => {
    component.onRevealNext();
    expect(signalRMock.revealPictophoneNext).toHaveBeenCalledWith('PICT');

    component.onStarPage({ bookIndex: 0, pageIndex: 1 });
    expect(signalRMock.starPictophonePage).toHaveBeenCalledWith('PICT', 0, 1);
  });

  it('should execute host administrative controls', () => {
    component.pauseGame();
    expect(signalRMock.pauseGame).toHaveBeenCalled();

    component.resumeGame();
    expect(signalRMock.resumeGame).toHaveBeenCalled();

    component.forceNext();
    expect(signalRMock.forcePictophoneNext).toHaveBeenCalledWith('PICT');
  });
});
