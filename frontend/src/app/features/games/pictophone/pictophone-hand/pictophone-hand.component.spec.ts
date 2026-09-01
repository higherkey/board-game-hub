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

  it('should submit page content via SignalR', () => {
    component.onSubmit('Test prompt');
    expect(signalRMock.submitPictophonePage).toHaveBeenCalledWith('Test prompt');
  });

  it('should submit draft via SignalR', () => {
    component.onDraftChanged('Drafting...');
    expect(signalRMock.submitPictophoneDraft).toHaveBeenCalledWith('Drafting...');
  });

  it('should dispatch star action', () => {
    component.onStarPage({ bookIndex: 0, pageIndex: 1 });
    expect(signalRMock.starPictophonePage).toHaveBeenCalledWith('PICT', 0, 1);
  });
});
