import { TestBed } from '@angular/core/testing';
import { SignalRService } from './signalr.service';
import { HubConnectionBuilder, HubConnectionState } from '@microsoft/signalr';
import { AuthService } from './auth.service';
import { ToastService } from '../shared/services/toast.service';
import { LoggerService } from '../core/services/logger.service';

describe('SignalRService', () => {
  let service: SignalRService;
  let mockHubConnection: any; // Using any to mock complex HubConnection type easily

  // Helper to find the callback registered for a specific event
  function getCallback(eventName: string): any {
    const calls = mockHubConnection.on.calls.all();
    const call = calls.find((c: any) => c.args[0] === eventName);
    return call ? call.args[1] : undefined;
  }

  beforeEach(() => {
    // 1. Create the Mock HubConnection
    mockHubConnection = jasmine.createSpyObj('HubConnection', ['start', 'invoke', 'on', 'stop', 'off', 'onreconnected', 'onreconnecting', 'onclose']);

    // Default state
    mockHubConnection.state = HubConnectionState.Disconnected;

    // Make start return a resolved promise
    mockHubConnection.start.and.returnValue(Promise.resolve());
    mockHubConnection.invoke.and.returnValue(Promise.resolve());

    // 2. Mock the HubConnectionBuilder to return our mock connection
    // We need to spy on the prototype because "new HubConnectionBuilder()" is called in the constructor
    const builderSpy = jasmine.createSpyObj('HubConnectionBuilder', ['withUrl', 'withAutomaticReconnect', 'build']);

    // Fluent API mocks
    builderSpy.withUrl.and.returnValue(builderSpy);
    builderSpy.withAutomaticReconnect.and.returnValue(builderSpy);
    builderSpy.build.and.returnValue(mockHubConnection);

    spyOn(HubConnectionBuilder.prototype, 'withUrl').and.returnValue(builderSpy);
    spyOn(HubConnectionBuilder.prototype, 'withAutomaticReconnect').and.returnValue(builderSpy);
    spyOn(HubConnectionBuilder.prototype, 'build').and.returnValue(mockHubConnection);

    const mockAuthService = {
      getGuestId: jasmine.createSpy('getGuestId').and.returnValue('guest-uuid')
    };

    const mockToastService = {
      showInfo: jasmine.createSpy('showInfo'),
      showError: jasmine.createSpy('showError')
    };

    // Default mock behavior for invoke to return valid Promises to avoid crashes
    mockHubConnection.invoke.and.returnValue(Promise.resolve());
    mockHubConnection.invoke.withArgs('ValidateRooms', jasmine.any(Array)).and.returnValue(Promise.resolve([]));

    TestBed.configureTestingModule({
      providers: [
        SignalRService,
        { provide: AuthService, useValue: mockAuthService },
        { provide: ToastService, useValue: mockToastService },
        {
          provide: LoggerService, useValue: {
            debug: jasmine.createSpy('debug'),
            info: jasmine.createSpy('info'),
            warn: jasmine.createSpy('warn'),
            error: jasmine.createSpy('error')
          }
        }
      ]
    });
    service = TestBed.inject(SignalRService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
    expect(mockHubConnection.on).toHaveBeenCalled(); // Should register listeners in constructor
  });

  describe('startConnection', () => {
    it('should start connection if disconnected', async () => {
      mockHubConnection.state = HubConnectionState.Disconnected;
      await service.startConnection();
      expect(mockHubConnection.start).toHaveBeenCalled();
      service.connectionStatus$.subscribe(status => {
        if (status === 'Connected') {
          expect(status).toBe('Connected');
        }
      });
    });

    it('should NOT start connection if already connected', async () => {
      mockHubConnection.state = HubConnectionState.Connected;
      await service.startConnection();
      expect(mockHubConnection.start).not.toHaveBeenCalled();
    });

    it('should update status to Error if start fails', async () => {
      mockHubConnection.start.and.returnValue(Promise.reject(new Error('Network Error')));

      await expectAsync(service.startConnection()).toBeRejectedWithError('Network Error');

      expect(service.connectionStatus$.value).toBe('Error');
    });
  });

  describe('Room Interactions', () => {
    it('createRoom should invoke CreateRoom and update currentRoomSubject', async () => {
      mockHubConnection.invoke.withArgs('CreateRoom', 'Host', true, 'Scatterbrain', 'guest-uuid', false).and.returnValue(Promise.resolve({
        code: 'ABCD',
        players: [],
        gameType: 'Scatterbrain',
        settings: { timerDurationSeconds: 60, letterMode: 0 }
      }));
      // Also mock ValidateRooms which might be called?
      mockHubConnection.invoke.withArgs('ValidateRooms', jasmine.any(Array)).and.returnValue(Promise.resolve([]));

      const code = await service.createRoom('Host', true, 'Scatterbrain');

      expect(mockHubConnection.invoke).toHaveBeenCalledWith('CreateRoom', 'Host', true, 'Scatterbrain', 'guest-uuid', false);
      expect(code).toBe('ABCD');
      expect(service.currentRoomSubject.value?.code).toBe('ABCD');
      expect(service.currentRoomSubject.value?.gameType).toBe('Scatterbrain');
    });

    it('joinRoom should invoke JoinRoom and update currentRoomSubject on success', async () => {
      mockHubConnection.invoke.withArgs('JoinRoom', 'ABCD', 'Player', 'guest-uuid', false).and.returnValue(Promise.resolve({
        code: 'ABCD',
        players: [],
        gameType: 'Scatterbrain',
        settings: { timerDurationSeconds: 60, letterMode: 0 }
      }));

      const result = await service.joinRoom('ABCD', 'Player');

      expect(mockHubConnection.invoke).toHaveBeenCalledWith('JoinRoom', 'ABCD', 'Player', 'guest-uuid', false);
      expect(result).toBeTrue();
      expect(service.currentRoomSubject.value?.code).toBe('ABCD');
    });

    it('joinRoom should NOT update currentRoomSubject on failure', async () => {
      mockHubConnection.invoke.withArgs('JoinRoom', 'ABCD', 'Player', 'guest-uuid', false).and.returnValue(Promise.resolve(null));

      const result = await service.joinRoom('ABCD', 'Player');

      expect(mockHubConnection.invoke).toHaveBeenCalledWith('JoinRoom', 'ABCD', 'Player', 'guest-uuid', false);
      expect(result).toBeFalse();
      expect(service.currentRoomSubject.value).toBeNull();
    });
  });

  describe('Lobby Actions', () => {
    it('joinLobby should invoke JoinLobby', async () => {
      mockHubConnection.state = HubConnectionState.Connected;
      mockHubConnection.invoke.withArgs('GetPublicRooms').and.returnValue(Promise.resolve([]));
      await service.joinLobby();
      expect(mockHubConnection.invoke).toHaveBeenCalledWith('JoinLobby');
    });

    it('leaveLobby should invoke LeaveLobby', async () => {
      mockHubConnection.state = HubConnectionState.Connected;
      await service.leaveLobby();
      expect(mockHubConnection.invoke).toHaveBeenCalledWith('LeaveLobby');
    });

    it('getPublicRooms should invoke GetPublicRooms and return array', async () => {
      const mockRooms = [{ code: 'PUB1' }, { code: 'PUB2' }] as any;
      mockHubConnection.invoke.withArgs('GetPublicRooms').and.returnValue(Promise.resolve(mockRooms));

      const rooms = await service.getPublicRooms();

      expect(mockHubConnection.invoke).toHaveBeenCalledWith('GetPublicRooms');
      expect(rooms).toEqual(mockRooms);
    });
  });

  describe('Game Actions', () => {
    // Setup a room first for these tests
    beforeEach(() => {
      service.currentRoomSubject.next({
        code: 'TEST',
        players: [],
        state: 'Lobby',
        settings: { timerDurationSeconds: 60, letterMode: 0 },
        gameType: 'Scatterbrain',
        gameState: null,
        roundNumber: 0,
        isPaused: false,
        roundScores: {},
        nextGameVotes: {},
        undoSettings: { allowVoting: true, hostOnly: false },
        currentVote: undefined,
        gameData: null
      });
    });

    it('startGame should invoke StartGame', async () => {
      const settings = { timerDurationSeconds: 30, letterMode: 1 };
      await service.startGame(settings);
      expect(mockHubConnection.invoke).toHaveBeenCalledWith('StartGame', 'TEST', settings);
    });

    it('startGame should NOT invoke if no room code', async () => {
      service.currentRoomSubject.next(null);
      await service.startGame(null);
      expect(mockHubConnection.invoke).not.toHaveBeenCalledWith('StartGame', jasmine.any(String), jasmine.any(Object));
    });

    it('pauseGame should invoke PauseGame', async () => {
      await service.pauseGame();
      expect(mockHubConnection.invoke).toHaveBeenCalledWith('PauseGame', 'TEST');
    });

    it('resumeGame should invoke ResumeGame', async () => {
      await service.resumeGame();
      expect(mockHubConnection.invoke).toHaveBeenCalledWith('ResumeGame', 'TEST');
    });

    it('submitAnswers should invoke SubmitAnswers', async () => {
      const answers = ['apple', 'banana'];
      service.submitAnswers(answers);
      expect(mockHubConnection.invoke).toHaveBeenCalledWith('SubmitAnswers', 'TEST', answers);
    });

    it('endRound should invoke EndRound', async () => {
      await service.endRound();
      expect(mockHubConnection.invoke).toHaveBeenCalledWith('EndRound', 'TEST');
    });

    it('nextRound should invoke NextRound', async () => {
      await service.nextRound();
      expect(mockHubConnection.invoke).toHaveBeenCalledWith('NextRound', 'TEST');
    });

    it('voteNextGame should invoke VoteNextGame', async () => {
      await service.voteNextGame('Babble');
      expect(mockHubConnection.invoke).toHaveBeenCalledWith('VoteNextGame', 'TEST', 'Babble');
    });

    it('updateSettings should invoke UpdateSettings', async () => {
      const newSettings = { timerDurationSeconds: 120, letterMode: 0 };
      await service.updateSettings(newSettings);
      expect(mockHubConnection.invoke).toHaveBeenCalledWith('UpdateSettings', 'TEST', newSettings);
    });
  });

  describe('Connection Events', () => {
    it('should set status to Reconnecting on onreconnecting event', () => {
      const callback = getCallback('onreconnecting'); // Wait, getCallback parses 'on' calls. 'onreconnecting' is a direct method on HubConnection.
      // In the mockup, we mocked onreconnecting as a spy. Let's trigger it if we captured it.
      // Actually, in SignalRService constructor: `this.hubConnection.onreconnecting(error => { ... })`
      expect(mockHubConnection.onreconnecting).toHaveBeenCalled();
      const reconnectCallback = mockHubConnection.onreconnecting.calls.argsFor(0)[0];
      
      reconnectCallback(new Error('Dropped!'));
      expect(service.connectionStatus$.value).toBe('Reconnecting');
    });

    it('should set status to Connected on onreconnected event', () => {
      expect(mockHubConnection.onreconnected).toHaveBeenCalled();
      const reconnectedCallback = mockHubConnection.onreconnected.calls.argsFor(0)[0];
      
      reconnectedCallback('new-connection-id');
      expect(service.connectionStatus$.value).toBe('Connected');
    });

    it('should set status to Disconnected on onclose event', () => {
      expect(mockHubConnection.onclose).toHaveBeenCalled();
      const closeCallback = mockHubConnection.onclose.calls.argsFor(0)[0];
      
      closeCallback(new Error('Closed!'));
      expect(service.connectionStatus$.value).toBe('Disconnected');
    });
  });

  describe('Event Listeners', () => {


    it('should update players$ when PlayerJoined event is received', () => {
      const callback = getCallback('PlayerJoined');
      expect(callback).toBeDefined();

      const players = [{ connectionId: '1', name: 'P1', score: 0, isHost: true, isReady: true, isScreen: false }];
      callback(players);
      expect(service.players$.value).toEqual(players);
    });

    it('should update currentRoom when GameStarted event is received', () => {
      const callback = getCallback('GameStarted');
      const room = { code: 'ABC', state: 1 } as any;

      callback(room);
      expect(service.currentRoomSubject.value).toEqual(room);
    });

    it('should update room on GameTypeChanged', () => {
      // Initialize room
      service.currentRoomSubject.next({ code: 'ABC', gameType: 'Old' } as any);

      const callback = getCallback('GameTypeChanged');
      callback('NewGame');

      expect(service.currentRoomSubject.value?.gameType).toBe('NewGame');
    });

    it('should update room on RoomUpdated', () => {
      const callback = getCallback('RoomUpdated');
      const room = { code: 'UPD', roundNumber: 5 } as any;

      callback(room);
      expect(service.currentRoomSubject.value).toEqual(room);
    });

    it('should update settings on SettingsUpdated', () => {
      service.currentRoomSubject.next({ code: 'ABC', settings: { timerDurationSeconds: 10 } } as any);

      const callback = getCallback('SettingsUpdated');
      const newSettings = { timerDurationSeconds: 999, letterMode: 2 };

      callback(newSettings);

      expect(service.currentRoomSubject.value?.settings.timerDurationSeconds).toBe(999);
    });

    it('should patch currentRoom on RoomStatePatch', () => {
      // Setup initial state
      const initialRoom: any = {
        code: 'PATCH',
        players: [{ name: 'A' }],
        settings: { timerDurationSeconds: 10 },
        gameData: { score: 0 }
      };
      service.currentRoomSubject.next(initialRoom);

      const callback = getCallback('RoomStatePatch');

      // Patch: Update settings time and add a player, change gameData score
      const patch = {
        settings: { timerDurationSeconds: 20 },
        gameData: { score: 100 },
        // Deep nested array replacement (arrays are replaced in our logic)
        // actually players is NOT replaced deep, it's just a prop
        players: [{ name: 'A' }, { name: 'B' }]
      };

      callback(patch);

      const updated = service.currentRoomSubject.value;
      expect(updated).not.toBeNull();
      // Verified merged properties
      expect(updated?.settings.timerDurationSeconds).toBe(20);
      expect(updated?.gameData.score).toBe(100);
      expect(updated?.players.length).toBe(2);
      expect(updated?.code).toBe('PATCH'); // Should verify original props remain
    });
  });
});
