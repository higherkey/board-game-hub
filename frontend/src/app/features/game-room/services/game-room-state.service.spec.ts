import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { map, filter, take } from 'rxjs/operators';
import { GameRoomStateService } from './game-room-state.service';
import { AuthService } from '../../../services/auth.service';
import { GameDataService } from '../../../services/game-data.service';
import { SignalRService, Room, Player } from '../../../services/signalr.service';
import { ToastService } from '../../../shared/services/toast.service';
import { LoggerService } from '../../../core/services/logger.service';

describe('GameRoomStateService', () => {
  let service: GameRoomStateService;
  let signalRMock: any;
  let authMock: any;
  let routerMock: any;
  let toastMock: any;
  let loggerMock: any;

  const mockRoom: Room = {
    code: 'ABCD',
    players: [{ connectionId: 'my-id', name: 'Tester', isHost: true, isReady: false, isScreen: false, score: 0 }],
    state: 'Lobby',
    gameType: 'Scatterbrain',
    settings: { timerDurationSeconds: 60, letterMode: 0, boardSize: 4 },
    gameState: {},
    gameData: {},
    roundNumber: 1,
    isPaused: false,
    nextGameVotes: {},
    roundScores: {},
    undoSettings: { allowVoting: true, hostOnly: false },
    currentVote: null
  };

  beforeEach(() => {
    signalRMock = {
      players$: new BehaviorSubject<Player[]>(mockRoom.players),
      connectionStatus$: new BehaviorSubject<string>('Connected'),
      currentRoomSubject: new BehaviorSubject<Room | null>(mockRoom),
      currentRoom$: new BehaviorSubject<Room | null>(mockRoom),
      me$: of(mockRoom.players[0]),
      connectionId$: new BehaviorSubject<string | null>('my-id'),
      isHost$: new BehaviorSubject<boolean>(true),
      getConnectionId: jasmine.createSpy('getConnectionId').and.returnValue('my-id'),
      checkIsHost: jasmine.createSpy('checkIsHost').and.returnValue(true),
      startConnection: jasmine.createSpy('startConnection'),
      clearState: jasmine.createSpy('clearState'),
      joinRoom: jasmine.createSpy('joinRoom').and.returnValue(Promise.resolve(true)),
      createRoom: jasmine.createSpy('createRoom').and.returnValue(Promise.resolve('NEW1')),
      updateIsHostStatus: jasmine.createSpy('updateIsHostStatus'),
      toggleReady: jasmine.createSpy('toggleReady').and.returnValue(Promise.resolve()),
      setGameType: jasmine.createSpy('setGameType'),
      startGame: jasmine.createSpy('startGame'),
      updateSettings: jasmine.createSpy('updateSettings').and.returnValue(Promise.resolve()),
      nextRound: jasmine.createSpy('nextRound').and.returnValue(Promise.resolve()),
      endGame: jasmine.createSpy('endGame').and.returnValue(Promise.resolve()),
      requestUndo: jasmine.createSpy('requestUndo').and.returnValue(Promise.resolve()),
      leaveRoom: jasmine.createSpy('leaveRoom').and.returnValue(Promise.resolve()),
      changeRole: jasmine.createSpy('changeRole').and.returnValue(Promise.resolve()),
      setHostPlayer: jasmine.createSpy('setHostPlayer').and.returnValue(Promise.resolve()),
      removeHostPlayer: jasmine.createSpy('removeHostPlayer').and.returnValue(Promise.resolve()),
      removeActiveRoom: jasmine.createSpy('removeActiveRoom')
    };

    authMock = {
      session$: of({}),
      getGuestName: jasmine.createSpy('getGuestName').and.returnValue('Tester'),
      setGuestName: jasmine.createSpy('setGuestName'),
      currentUserValue: { displayName: 'Tester' }
    };

    routerMock = {
      navigate: jasmine.createSpy('navigate')
    };

    toastMock = {
      showError: jasmine.createSpy('showError'),
      showInfo: jasmine.createSpy('showInfo')
    };

    loggerMock = {
      info: jasmine.createSpy('info'),
      error: jasmine.createSpy('error'),
      warn: jasmine.createSpy('warn'),
      debug: jasmine.createSpy('debug')
    };

    TestBed.configureTestingModule({
      providers: [
        GameRoomStateService,
        { provide: SignalRService, useValue: signalRMock },
        { provide: AuthService, useValue: authMock },
        { provide: Router, useValue: routerMock },
        { provide: ActivatedRoute, useValue: { snapshot: { params: {} } } },
        { provide: ToastService, useValue: toastMock },
        { provide: LoggerService, useValue: loggerMock },
        { provide: GameDataService, useValue: { getGameDefinitions: () => of([]) } }
      ]
    });

    service = TestBed.inject(GameRoomStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Observables', () => {
    it('should derive gameStarted$ correctly', (done) => {
      service.gameStarted$.subscribe(started => {
        expect(started).toBeFalse(); // Lobby state
        done();
      });
    });

    it('should update gameStarted$ when room state changes', (done) => {
      let emissionCount = 0;
      service.gameStarted$.subscribe(started => {
        emissionCount++;
        if (emissionCount === 2) {
          expect(started).toBeTrue();
          done();
        }
      });

      signalRMock.currentRoom$.next({ ...mockRoom, state: 'Playing' });
    });
  });

  describe('Room Lifecycle', () => {
    it('should initialize connection on initializeRoom', () => {
      service.initializeRoom('ABCD', false);
      expect(signalRMock.startConnection).toHaveBeenCalled();
    });

    it('should create room and navigate on submitEntry (isCreating=true)', async () => {
      const entry = { name: 'NewRoom', joinType: 'player' as const, isPublic: true };
      const success = await service.submitEntry('ABCD', true, entry, 'Scatterbrain');
      
      expect(success).toBeTrue();
      expect(signalRMock.createRoom).toHaveBeenCalledWith('NewRoom', true, 'Scatterbrain', false);
      expect(routerMock.navigate).toHaveBeenCalledWith(['/game', 'NEW1']);
    });

    it('should join room on submitEntry (isCreating=false)', async () => {
      const entry = { name: 'PlayerName', joinType: 'player' as const, isPublic: false };
      const success = await service.submitEntry('ABCD', false, entry, 'Scatterbrain');

      expect(success).toBeTrue();
      expect(signalRMock.joinRoom).toHaveBeenCalledWith('ABCD', 'PlayerName', false);
    });

    it('should toast and navigate to /play when joinRoom returns false on submitEntry (isCreating=false)', async () => {
      signalRMock.joinRoom.and.returnValue(Promise.resolve(false));
      const entry = { name: 'PlayerName', joinType: 'player' as const, isPublic: false };
      const success = await service.submitEntry('ABCD', false, entry, 'Scatterbrain');

      expect(success).toBeFalse();
      expect(toastMock.showError).toHaveBeenCalledWith('Room "ABCD" not found or no longer active.');
      expect(routerMock.navigate).toHaveBeenCalledWith(['/play']);
    });

    it('should handle errors in submitEntry', async () => {
      signalRMock.createRoom.and.returnValue(Promise.reject('error'));
      const entry = { name: 'NewRoom', joinType: 'player' as const, isPublic: true };
      
      const success = await service.submitEntry('ABCD', true, entry, 'Scatterbrain');
      
      expect(success).toBeFalse();
      expect(toastMock.showError).toHaveBeenCalled();
    });
  });

  describe('Facade Methods', () => {
    it('should call signalRService.toggleReady', async () => {
      await service.toggleReady('ABCD', true);
      expect(signalRMock.toggleReady).toHaveBeenCalledWith('ABCD', true);
    });

    it('should handle toggleReady errors gracefully', async () => {
      signalRMock.toggleReady.and.returnValue(Promise.reject('fail'));
      await service.toggleReady('ABCD', true);
      expect(toastMock.showError).toHaveBeenCalled();
    });

    it('should navigate on leaveRoom', async () => {
      await service.leaveRoom('ABCD');
      expect(signalRMock.leaveRoom).toHaveBeenCalledWith('ABCD');
      expect(routerMock.navigate).toHaveBeenCalledWith(['/games']);
    });

    it('should call changeRole', async () => {
      await service.changeRole(true);
      expect(signalRMock.changeRole).toHaveBeenCalledWith(true);
    });
  });

  describe('State Syncing', () => {
    it('should select host component for host view', (done) => {
      service.isScreen = true;
      // Skip the initial null emission and capture the first valid component emission
      service.gameComponent$.pipe(
        filter((c: any) => !!c),
        take(1)
      ).subscribe(comp => {
        expect(comp).toBeTruthy();
        done();
      });
      signalRMock.currentRoom$.next(mockRoom);
    });
  });
});
