import { TestBed } from '@angular/core/testing';
import { SignalRService, GameSettings, Room } from './signalr.service';
import { HubConnectionBuilder, HubConnection, HubConnectionState } from '@microsoft/signalr';
import { BehaviorSubject } from 'rxjs';

describe('SignalRService', () => {
  let service: SignalRService;
  let mockHubConnection: any; // Using any to mock complex HubConnection type easily

  beforeEach(() => {
    // 1. Create the Mock HubConnection
    mockHubConnection = jasmine.createSpyObj('HubConnection', ['start', 'invoke', 'on', 'stop', 'off']);

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

    TestBed.configureTestingModule({});
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
      mockHubConnection.start.and.returnValue(Promise.reject('Network Error'));
      await service.startConnection();
      expect(service.connectionStatus$.value).toBe('Error');
    });
  });

  describe('Room Interactions', () => {
    it('createRoom should invoke CreateRoom and update currentRoomSubject', async () => {
      mockHubConnection.invoke.and.returnValue(Promise.resolve('ABCD'));

      const code = await service.createRoom('Host', true);

      expect(mockHubConnection.invoke).toHaveBeenCalledWith('CreateRoom', 'Host', true, 'Scatterbrain');
      expect(code).toBe('ABCD');
      expect(service.currentRoomSubject.value?.code).toBe('ABCD');
      expect(service.currentRoomSubject.value?.gameType).toBe('Scatterbrain');
    });

    it('joinRoom should invoke JoinRoom and update currentRoomSubject on success', async () => {
      mockHubConnection.invoke.and.returnValue(Promise.resolve(true));

      const result = await service.joinRoom('ABCD', 'Player');

      expect(mockHubConnection.invoke).toHaveBeenCalledWith('JoinRoom', 'ABCD', 'Player');
      expect(result).toBeTrue();
      expect(service.currentRoomSubject.value?.code).toBe('ABCD');
    });

    it('joinRoom should NOT update currentRoomSubject on failure', async () => {
      mockHubConnection.invoke.and.returnValue(Promise.resolve(false));

      const result = await service.joinRoom('ABCD', 'Player');

      expect(result).toBeFalse();
      expect(service.currentRoomSubject.value).toBeNull();
    });
  });

  describe('Game Actions', () => {
    // Setup a room first for these tests
    beforeEach(() => {
      service.currentRoomSubject.next({
        code: 'TEST',
        players: [],
        state: 0,
        settings: { timerDurationSeconds: 60, letterMode: 0 },
        gameType: 'Scatterbrain',
        gameState: null,
        roundNumber: 0,
        isPaused: false,
        roundScores: {},
        nextGameVotes: {}
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
      await service.submitAnswers(answers);
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
      await service.voteNextGame('Boggle');
      expect(mockHubConnection.invoke).toHaveBeenCalledWith('VoteNextGame', 'TEST', 'Boggle');
    });

    it('updateSettings should invoke UpdateSettings', async () => {
      const newSettings = { timerDurationSeconds: 120, letterMode: 0 };
      await service.updateSettings(newSettings);
      expect(mockHubConnection.invoke).toHaveBeenCalledWith('UpdateSettings', 'TEST', newSettings);
    });
  });

  describe('Event Listeners', () => {
    // Helper to find the callback registered for a specific event
    function getCallback(eventName: string): Function {
      const calls = mockHubConnection.on.calls.all();
      const call = calls.find((c: any) => c.args[0] === eventName);
      return call ? call.args[1] : null;
    }

    it('should update players$ when PlayerJoined event is received', () => {
      const callback = getCallback('PlayerJoined');
      expect(callback).toBeDefined();

      const players = [{ connectionId: '1', name: 'P1', score: 0, isHost: true }];
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
  });
});
