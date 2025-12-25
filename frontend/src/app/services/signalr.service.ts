import { Injectable } from '@angular/core';
import { HubConnection, HubConnectionBuilder, HubConnectionState } from '@microsoft/signalr';
import { BehaviorSubject } from 'rxjs';
import { ToastService } from '../shared/services/toast.service';
import { AuthService } from './auth.service';

export interface GameSettings {
  timerDurationSeconds: number;
  letterMode: number; // 0=Normal, 1=Hard, 2=TrueRandom
  boardSize?: number; // 4, 5, 6
  listId?: number;
  customCategories?: string[];
}

export interface Player {
  connectionId: string;
  name: string;
  score: number;
  isHost: boolean;
  avatarUrl?: string;
  userId?: string;
}

export type RoomState = 'Lobby' | 'Playing' | 'Finished';

export interface Room {
  code: string;
  players: Player[];
  state: RoomState;
  settings: GameSettings;
  gameType: string;

  // Generic Game State
  // Generic Game State
  gameState: any; // Deprecated: Use gameData
  gameData: any; // Matches backend property

  roundNumber: number;

  // Voting
  nextGameVotes: { [key: string]: number }; // Vote is GameType enum int or string

  roundEndTime?: string;
  isPaused: boolean;
  timeRemainingWhenPaused?: string;

  // Scores
  // Scores
  roundScores: { [key: string]: number };
  playerAnswers?: { [key: string]: string[] };

  // Undo System
  currentVote: any; // { initiatorId, initiatorName, votes: {} }
  undoSettings: { allowVoting: boolean, hostOnly: boolean };
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

  // Generic Game Events (for custom game logic events)
  public gameEvents$ = new BehaviorSubject<{ type: string, payload: any } | null>(null);
  // Generic Game State Push (for optimized updates)
  public gameState$ = new BehaviorSubject<any>(null);

  // WebRTC Signaling Subjects
  public offerReceived$ = new BehaviorSubject<{ senderId: string, sdp: string } | null>(null);
  public answerReceived$ = new BehaviorSubject<{ senderId: string, sdp: string } | null>(null);
  public iceCandidateReceived$ = new BehaviorSubject<{ senderId: string, candidate: string } | null>(null);

  constructor(
    private readonly toastService: ToastService,
    private readonly authService: AuthService
  ) {
    this.hubConnection = new HubConnectionBuilder()
      .withUrl('/gamehub', {
        accessTokenFactory: () => localStorage.getItem('auth_token') || ''
      })
      .withAutomaticReconnect()
      .build();

    this.loadActiveRooms();

    this.hubConnection.on('PlayerJoined', (players: Player[]) => {
      this.players$.next(players);
    });

    this.hubConnection.on('GameStarted', (room: Room) => {
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

    this.hubConnection.on('UndoVoteStarted', (vote: any) => {
      const current = this.currentRoomSubject.value;
      if (current) {
        current.currentVote = vote;
        this.currentRoomSubject.next({ ...current });
      }
    });

    this.hubConnection.on('UndoVoteUpdate', (vote: any) => {
      const current = this.currentRoomSubject.value;
      if (current) {
        current.currentVote = vote;
        this.currentRoomSubject.next({ ...current });
      }
    });

    this.hubConnection.on('UndoVoteFinished', () => {
      // Just a signal, room update comes separately usually, 
      // but we can clear vote here locally to be safe.
      const current = this.currentRoomSubject.value;
      if (current) {
        current.currentVote = null;
        this.currentRoomSubject.next({ ...current });
      }
    });

    this.hubConnection.on('GameRestored', (room: Room) => {
      // Full state restore
      this.currentRoomSubject.next(room);
      this.toastService.showInfo('Game state has been reverted!');
    });

    this.hubConnection.on('GameEvent', (type: string, payload: any) => {
      this.gameEvents$.next({ type, payload });
    });

    this.hubConnection.on('GameState', (state: any) => {
      this.gameState$.next(state);
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

    this.hubConnection.on('RoomTerminated', (message: string) => {
      const room = this.currentRoomSubject.value;
      if (room) {
        this.removeActiveRoom(room.code);
        this.currentRoomSubject.next(null);
        this.toastService.showError(message || 'Room has been closed');
      }
    });

    this.hubConnection.on('RoomDeleted', (code: string) => {
      this.removeActiveRoom(code);
    });

    this.hubConnection.on('RoomGameTypeChanged', (code: string, gameType: string) => {
      this.updateActiveRoomGameType(code, gameType);
    });

    this.hubConnection.onreconnected(() => {
      console.log('SignalR Reconnected');
      this.validateActiveRooms();
    });
  }

  // ... startConnection implementation ...

  public async startGame(settings: GameSettings | null = null): Promise<void> {
    await this.hubConnection.invoke('StartGame', this.currentRoomSubject.value?.code, settings);
  }

  public sendGameAction(actionType: string, payload: any) {
    this.hubConnection.invoke('SubmitAction', this.currentRoomSubject.value?.code, actionType, payload)
      .catch(err => console.error(err));
  }

  public async pauseGame(): Promise<void> {
    const roomCode = this.currentRoomSubject.value?.code;
    if (roomCode) await this.hubConnection.invoke('PauseGame', roomCode);
  }

  public async resumeGame(): Promise<void> {
    const roomCode = this.currentRoomSubject.value?.code;
    if (roomCode) await this.hubConnection.invoke('ResumeGame', roomCode);
  }

  public submitAnswers(answers: string[]) {
    this.hubConnection.invoke('SubmitAnswers', this.currentRoomSubject.value!.code, answers)
      .catch(err => console.error(err));
  }

  public submitClue(clue: string) {
    this.hubConnection.invoke('SubmitClue', this.currentRoomSubject.value!.code, clue)
      .catch(err => console.error(err));
  }

  public submitGuess(guess: string, isPass: boolean = false) {
    this.hubConnection.invoke('SubmitAction', this.currentRoomSubject.value!.code, 'SUBMIT_GUESS', { guess, isPass })
      .catch(err => console.error(err));
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

  public async updateUndoSettings(settings: { allowVoting: boolean, hostOnly: boolean }): Promise<void> {
    const roomCode = this.currentRoomSubject.value?.code;
    if (roomCode) await this.hubConnection.invoke('UpdateUndoSettings', roomCode, settings);
  }

  public async requestUndo(): Promise<void> {
    const roomCode = this.currentRoomSubject.value?.code;
    if (roomCode) await this.hubConnection.invoke('RequestUndo', roomCode);
  }

  public async submitUndoVote(vote: boolean): Promise<void> {
    const roomCode = this.currentRoomSubject.value?.code;
    if (roomCode) await this.hubConnection.invoke('SubmitUndoVote', roomCode, vote);
  }

  private connectionPromise: Promise<void> | null = null;

  public async startConnection(): Promise<void> {
    if (this.hubConnection.state === HubConnectionState.Connected) {
      return;
    }

    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = (async () => {
      this.connectionStatus$.next('Connecting');
      try {
        await this.hubConnection.start();
        this.connectionStatus$.next('Connected');
        console.log('SignalR Connection started');

        // Proactively validate active rooms on startup to catch any that closed while offline
        this.validateActiveRooms();
      } catch (err) {
        console.error('Error while starting connection: ' + err);
        this.connectionStatus$.next('Error');
        throw err;
      } finally {
        this.connectionPromise = null;
      }
    })();

    return this.connectionPromise;
  }

  // --- Active Room Persistence ---
  private readonly ACTIVE_ROOMS_KEY = 'my_active_rooms';
  public activeRooms$ = new BehaviorSubject<{ code: string, gameType: string, lastPlayed: string }[]>([]);

  public getActiveRooms(): { code: string, gameType: string, lastPlayed: string }[] {
    const raw = localStorage.getItem(this.ACTIVE_ROOMS_KEY);
    return raw ? JSON.parse(raw) : [];
  }

  private loadActiveRooms() {
    this.activeRooms$.next(this.getActiveRooms());
  }

  private saveActiveRoom(code: string, gameType: string) {
    const rooms = this.getActiveRooms().filter(r => r.code !== code);
    rooms.unshift({ code, gameType, lastPlayed: new Date().toISOString() });
    localStorage.setItem(this.ACTIVE_ROOMS_KEY, JSON.stringify(rooms));
    this.loadActiveRooms();
  }

  private updateActiveRoomGameType(code: string, gameType: string) {
    const rooms = this.getActiveRooms();
    const room = rooms.find(r => r.code === code);
    if (room) {
      room.gameType = gameType;
      localStorage.setItem(this.ACTIVE_ROOMS_KEY, JSON.stringify(rooms));
      this.loadActiveRooms();
    }
  }

  public removeActiveRoom(code: string) {
    const rooms = this.getActiveRooms().filter(r => r.code !== code);
    localStorage.setItem(this.ACTIVE_ROOMS_KEY, JSON.stringify(rooms));
    this.loadActiveRooms();
  }

  public async validateActiveRooms(): Promise<void> {
    const currentRooms = this.getActiveRooms();
    if (currentRooms.length === 0) return;

    if (this.hubConnection.state !== HubConnectionState.Connected) {
      await this.startConnection();
    }

    try {
      const codes = currentRooms.map(r => r.code);
      const validCodes: string[] = await this.hubConnection.invoke('ValidateRooms', codes);

      const prunedRooms = currentRooms.filter(r => validCodes.includes(r.code));

      if (prunedRooms.length !== currentRooms.length) {
        localStorage.setItem(this.ACTIVE_ROOMS_KEY, JSON.stringify(prunedRooms));
        this.loadActiveRooms();
      }
    } catch (err) {
      console.error('Failed to validate active rooms:', err);
    }
  }

  public async createRoom(playerName: string, isPublic: boolean, gameType: string = 'None'): Promise<string> {
    const guestId = this.authService.getGuestId();
    const roomCode = await this.hubConnection.invoke('CreateRoom', playerName, isPublic, gameType, guestId);

    // Save to active rooms
    this.saveActiveRoom(roomCode, gameType);

    // Initialize currentRoomSubject with the room code so startGame can use it
    this.currentRoomSubject.next({
      code: roomCode,
      players: [],
      state: 'Lobby',
      settings: { timerDurationSeconds: 60, letterMode: 0 },
      gameType: gameType,
      gameState: null,
      gameData: null,
      roundNumber: 0,
      isPaused: false,
      roundScores: {},
      nextGameVotes: {},
      currentVote: null,
      undoSettings: { allowVoting: true, hostOnly: false }
    });
    return roomCode;
  }

  public async getPublicRooms(): Promise<any[]> {
    return await this.hubConnection.invoke('GetPublicRooms');
  }

  public async joinRoom(roomCode: string, playerName: string): Promise<boolean> {
    if (this.hubConnection.state !== HubConnectionState.Connected) {
      await this.startConnection();
    }
    const guestId = this.authService.getGuestId();
    const room = await this.hubConnection.invoke('JoinRoom', roomCode, playerName, guestId);
    if (room) {
      this.currentRoomSubject.next(room);
      this.players$.next(room.players); // Sync players immediately
      this.saveActiveRoom(roomCode, room.gameType); // Persist
      return true;
    } else {
      console.error('Failed to join room');
      return false;
    }
  }

  public async leaveRoom(roomCode: string): Promise<void> {
    await this.hubConnection.invoke('LeaveRoom', roomCode);
    this.removeActiveRoom(roomCode); // Remove from list
    this.currentRoomSubject.next(null); // Clear local state
  }

  public async renamePlayer(newName: string): Promise<void> {
    if (this.hubConnection.state !== HubConnectionState.Connected) {
      await this.startConnection();
    }
    await this.hubConnection.invoke('RenamePlayer', newName);
  }
  // ... rest of file

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
  public submitBreakingNewsSlot(slotId: number, value: string) {
    this.hubConnection.invoke('SubmitBreakingNewsSlot', this.currentRoomSubject.value!.code, slotId, value)
      .catch(err => console.error(err));
  }

  // --- Deepfake Methods ---
  public submitDeepfakeStroke(pathData: string, color: string) {
    this.hubConnection.invoke('DeepfakeStroke', this.currentRoomSubject.value!.code, pathData, color)
      .catch(err => console.error(err));
  }

  public submitDeepfakeVote(accusedId: string) {
    this.hubConnection.invoke('DeepfakeVote', this.currentRoomSubject.value!.code, accusedId)
      .catch(err => console.error(err));
  }

  public submitDeepfakeAiGuess(guess: string) {
    this.hubConnection.invoke('DeepfakeAiGuess', this.currentRoomSubject.value!.code, guess)
      .catch(err => console.error(err));
  }

  public getConnectionId(): string | null {
    return this.hubConnection.connectionId;
  }

  // --- Universal Translator Methods ---
  public submitUniversalTranslatorToken(token: string) {
    this.hubConnection.invoke('UniversalTranslatorToken', this.currentRoomSubject.value!.code, token)
      .catch(err => console.error(err));
  }

  public submitUniversalTranslatorVote(targetId: string) {
    this.hubConnection.invoke('UniversalTranslatorVote', this.currentRoomSubject.value!.code, targetId)
      .catch(err => console.error(err));
  }

  public pickUniversalTranslatorWord(word: string) {
    this.hubConnection.invoke('UniversalTranslatorPickWord', this.currentRoomSubject.value!.code, word)
      .catch(err => console.error(err));
  }

  // --- Poppycock Methods ---
  public submitPoppycockDefinition(definition: string) {
    this.hubConnection.invoke('SubmitPoppycockDefinition', this.currentRoomSubject.value!.code, definition)
      .catch(err => console.error(err));
  }

  public submitPoppycockVote(votedId: string) {
    this.hubConnection.invoke('SubmitPoppycockVote', this.currentRoomSubject.value!.code, votedId)
      .catch(err => console.error(err));
  }

  // --- Pictophone Methods ---
  public submitPictophonePage(content: string) {
    this.hubConnection.invoke('SubmitPictophonePage', this.currentRoomSubject.value!.code, content)
      .catch(err => console.error(err));
  }

  public submitPictophoneDraft(content: string) {
    this.hubConnection.invoke('SubmitPictophoneDraft', this.currentRoomSubject.value!.code, content)
      .catch(err => console.error(err));
  }

  public async forcePictophoneNext(roomCode: string) {
    await this.hubConnection.invoke('ForcePictophoneNext', roomCode);
  }

  public async revealPictophoneNext(roomCode: string) {
    await this.hubConnection.invoke('RevealPictophoneNext', roomCode);
  }

  public async starPictophonePage(roomCode: string, bookIndex: number, pageIndex: number): Promise<void> {
    await this.hubConnection.invoke('StarPictophonePage', roomCode, bookIndex, pageIndex);
  }

  public async getPictophoneSuggestions(): Promise<string[]> {
    return await this.hubConnection.invoke('GetPictophoneSuggestions');
  }
  // --- Symbology Methods ---
  public symbologyPlaceMarker(icon: string, type: string, color: string) {
    this.hubConnection.invoke('SymbologyPlaceMarker', this.currentRoomSubject.value!.code, icon, type, color)
      .catch(err => console.error(err));
  }

  public symbologyRemoveMarker(markerId: string) {
    this.hubConnection.invoke('SymbologyRemoveMarker', this.currentRoomSubject.value!.code, markerId)
      .catch(err => console.error(err));
  }
  // --- Wisecrack Methods ---
  public submitWisecrackAnswer(promptId: string, answer: string) {
    this.hubConnection.invoke('SubmitWisecrackAnswer', this.currentRoomSubject.value!.code, promptId, answer)
      .catch(err => console.error(err));
  }

  public submitWisecrackVote(choice: number) {
    this.hubConnection.invoke('SubmitWisecrackVote', this.currentRoomSubject.value!.code, choice)
      .catch(err => console.error(err));
  }

  public nextWisecrackBattle() {
    this.hubConnection.invoke('NextWisecrackBattle', this.currentRoomSubject.value!.code)
      .catch(err => console.error(err));
  }
  // --- Sushi Train ---
  public submitSushiTrainSelection(cardId: string) {
    this.hubConnection.invoke('SubmitSushiTrainSelection', this.currentRoomSubject.value!.code, cardId)
      .catch(err => console.error(err));
  }

  public toggleSushiTrainChopsticks() {
    this.hubConnection.invoke('ToggleSushiTrainChopsticks', this.currentRoomSubject.value!.code)
      .catch(err => console.error(err));
  }

  // --- Great Minds Methods ---
  public submitGreatMindsCard(cardValue: number) {
    this.hubConnection.invoke('SubmitGreatMindsCard', this.currentRoomSubject.value!.code, cardValue)
      .catch(err => console.error(err));
  }

  public submitGreatMindsSync() {
    this.hubConnection.invoke('SubmitGreatMindsSync', this.currentRoomSubject.value!.code)
      .catch(err => console.error(err));
  }
}

