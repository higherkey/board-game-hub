import { Injectable } from '@angular/core';
import { HubConnection, HubConnectionBuilder, HubConnectionState } from '@microsoft/signalr';
import { BehaviorSubject } from 'rxjs';

export interface GameSettings {
  timerDurationSeconds: number;
  letterMode: number; // 0=Normal, 1=Hard, 2=TrueRandom
  listId?: number;
  customCategories?: string[];
}

export interface Player {
  connectionId: string;
  name: string;
  score: number;
  isHost: boolean;
}

export interface Room {
  code: string;
  players: Player[];
  state: number; // 0=Lobby, 1=Playing, 2=Finished
  settings: GameSettings;
  gameType: string;

  // Generic Game State
  gameState: any; // ScatterbrainState or BoggleState

  roundNumber: number;

  // Voting
  nextGameVotes: { [key: string]: number }; // Vote is GameType enum int or string

  roundEndTime?: string;
  isPaused: boolean;
  timeRemainingWhenPaused?: string;

  // Scores
  roundScores: { [key: string]: number };
}

@Injectable({
  providedIn: 'root'
})
export class SignalRService {
  private readonly hubConnection: HubConnection;
  public players$ = new BehaviorSubject<Player[]>([]);
  public connectionStatus$ = new BehaviorSubject<string>('Disconnected');
  public currentRoomSubject = new BehaviorSubject<Room | null>(null);
  public currentRoom$ = this.currentRoomSubject.asObservable();

  // WebRTC Signaling Subjects
  public offerReceived$ = new BehaviorSubject<{ senderId: string, sdp: string } | null>(null);
  public answerReceived$ = new BehaviorSubject<{ senderId: string, sdp: string } | null>(null);
  public iceCandidateReceived$ = new BehaviorSubject<{ senderId: string, candidate: string } | null>(null);

  constructor() {
    this.hubConnection = new HubConnectionBuilder()
      .withUrl('http://localhost:5109/gamehub')
      .withAutomaticReconnect()
      .build();

    this.hubConnection.on('PlayerJoined', (players: Player[]) => {
      this.players$.next(players);
    });

    this.hubConnection.on('GameStarted', (room: Room) => {
      console.log('Game Started!', room);
      this.currentRoomSubject.next(room);
    });

    this.hubConnection.on('GamePaused', (room: Room) => {
      this.currentRoomSubject.next(room);
    });

    this.hubConnection.on('GameResumed', (room: Room) => {
      this.currentRoomSubject.next(room);
    });

    this.hubConnection.on('RoundEnded', (room: Room) => {
      this.currentRoomSubject.next(room);
    });

    this.hubConnection.on('GameTypeChanged', (gameType: string) => {
      const current = this.currentRoomSubject.value;
      if (current) {
        current.gameType = gameType;
        this.currentRoomSubject.next({ ...current });
      }
    });

    this.hubConnection.on('RoomUpdated', (room: Room) => {
      this.currentRoomSubject.next(room);
    });

    this.hubConnection.on('SettingsUpdated', (settings: GameSettings) => {
      const current = this.currentRoomSubject.value;
      if (current) {
        current.settings = settings;
        this.currentRoomSubject.next({ ...current });
      }
    });

    // WebRTC Listeners
    this.hubConnection.on('ReceiveOffer', (senderId: string, sdp: string) => {
      this.offerReceived$.next({ senderId, sdp });
    });

    this.hubConnection.on('ReceiveAnswer', (senderId: string, sdp: string) => {
      this.answerReceived$.next({ senderId, sdp });
    });

    this.hubConnection.on('ReceiveIceCandidate', (senderId: string, candidate: string) => {
      this.iceCandidateReceived$.next({ senderId, candidate });
    });
  }

  // ... startConnection implementation ...

  public async startGame(settings: GameSettings | null): Promise<void> {
    const roomCode = this.currentRoomSubject.value?.code;
    if (roomCode) {
      await this.hubConnection.invoke('StartGame', roomCode, settings);
    }
  }

  public async pauseGame(): Promise<void> {
    const roomCode = this.currentRoomSubject.value?.code;
    if (roomCode) await this.hubConnection.invoke('PauseGame', roomCode);
  }

  public async resumeGame(): Promise<void> {
    const roomCode = this.currentRoomSubject.value?.code;
    if (roomCode) await this.hubConnection.invoke('ResumeGame', roomCode);
  }

  public async submitAnswers(answers: string[]): Promise<void> {
    const roomCode = this.currentRoomSubject.value?.code;
    if (roomCode) await this.hubConnection.invoke('SubmitAnswers', roomCode, answers);
  }

  public async endRound(): Promise<void> {
    const roomCode = this.currentRoomSubject.value?.code;
    if (roomCode) await this.hubConnection.invoke('EndRound', roomCode);
  }

  public async nextRound(): Promise<void> {
    const roomCode = this.currentRoomSubject.value?.code;
    if (roomCode) await this.hubConnection.invoke('NextRound', roomCode);
  }

  public async voteNextGame(gameType: string): Promise<void> {
    const roomCode = this.currentRoomSubject.value?.code;
    if (roomCode) await this.hubConnection.invoke('VoteNextGame', roomCode, gameType);
  }

  public async updateSettings(settings: GameSettings): Promise<void> {
    const roomCode = this.currentRoomSubject.value?.code;
    if (roomCode) await this.hubConnection.invoke('UpdateSettings', roomCode, settings);
  }

  public async startConnection(): Promise<void> {
    if (this.hubConnection.state === HubConnectionState.Disconnected) {
      this.connectionStatus$.next('Connecting');
      try {
        await this.hubConnection.start();
        this.connectionStatus$.next('Connected');
        console.log('SignalR Connection started');
      } catch (err) {
        console.error('Error while starting connection: ' + err);
        this.connectionStatus$.next('Error');
      }
    }
  }

  public async createRoom(playerName: string, isPublic: boolean, gameType: string = 'Scatterbrain'): Promise<string> {
    const roomCode = await this.hubConnection.invoke('CreateRoom', playerName, isPublic, gameType);
    // Initialize currentRoomSubject with the room code so startGame can use it
    this.currentRoomSubject.next({
      code: roomCode,
      players: [],
      state: 0,
      settings: { timerDurationSeconds: 60, letterMode: 0 },
      gameType: gameType,
      gameState: null,
      roundNumber: 0,
      isPaused: false,
      roundScores: {},
      nextGameVotes: {}
    });
    return roomCode;
  }

  public async getPublicRooms(): Promise<any[]> {
    return await this.hubConnection.invoke('GetPublicRooms');
  }

  public async joinRoom(roomCode: string, playerName: string): Promise<boolean> {
    const success = await this.hubConnection.invoke('JoinRoom', roomCode, playerName);
    if (success) {
      // Initialize currentRoomSubject with the room code so startGame can use it
      this.currentRoomSubject.next({
        code: roomCode,
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
    } else {
      console.error('Failed to join room');
    }
    return success;
  }

  public async setGameType(roomCode: string, gameType: string): Promise<void> {
    await this.hubConnection.invoke('SetGameType', roomCode, gameType);
  }

  // WebRTC Invokers
  public async sendOffer(targetConnectionId: string, sdp: string) {
    await this.hubConnection.invoke('SendOffer', targetConnectionId, sdp);
  }

  public async sendAnswer(targetConnectionId: string, sdp: string) {
    await this.hubConnection.invoke('SendAnswer', targetConnectionId, sdp);
  }

  public async sendIceCandidate(targetConnectionId: string, candidate: string) {
    await this.hubConnection.invoke('SendIceCandidate', targetConnectionId, candidate);
  }
}
