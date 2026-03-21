import { BehaviorSubject, of, Observable } from 'rxjs';
import { Player, Room, GameSettings } from '../services/signalr.service';

export class MockSignalRService {
  public players$ = new BehaviorSubject<Player[]>([]);
  public connectionStatus$ = new BehaviorSubject<string>('Connected');
  public currentRoomSubject = new BehaviorSubject<Room | null>(null);
  public currentRoom$ = this.currentRoomSubject.asObservable();
  public publicRooms$ = new BehaviorSubject<Room[]>([]);
  public connectionId$ = new BehaviorSubject<string | null>('mock-conn-id');
  public me$: Observable<Player | null> = of(null);
  public isHost$ = new BehaviorSubject<boolean>(true);

  public gameEvents$ = new BehaviorSubject<{ type: string, payload: any } | null>(null);
  public gameState$ = new BehaviorSubject<any>(null);

  // Spies
  public startConnection = jasmine.createSpy('startConnection').and.returnValue(Promise.resolve());
  public startGame = jasmine.createSpy('startGame').and.returnValue(Promise.resolve());
  public sendGameAction = jasmine.createSpy('sendGameAction');
  public pauseGame = jasmine.createSpy('pauseGame').and.returnValue(Promise.resolve());
  public resumeGame = jasmine.createSpy('resumeGame').and.returnValue(Promise.resolve());
  public submitAnswers = jasmine.createSpy('submitAnswers');
  public endRound = jasmine.createSpy('endRound').and.returnValue(Promise.resolve());
  public endGame = jasmine.createSpy('endGame').and.returnValue(Promise.resolve());
  public nextRound = jasmine.createSpy('nextRound').and.returnValue(Promise.resolve());
  public voteNextGame = jasmine.createSpy('voteNextGame').and.returnValue(Promise.resolve());
  public updateSettings = jasmine.createSpy('updateSettings').and.returnValue(Promise.resolve());
  
  public joinRoom = jasmine.createSpy('joinRoom').and.returnValue(Promise.resolve(true));
  public createRoom = jasmine.createSpy('createRoom').and.returnValue(Promise.resolve('MOCK'));
  public getGameHistory = jasmine.createSpy('getGameHistory').and.returnValue(Promise.resolve([]));
  public getPublicRooms = jasmine.createSpy('getPublicRooms').and.returnValue(Promise.resolve([]));
  public joinLobby = jasmine.createSpy('joinLobby').and.returnValue(Promise.resolve());
  public leaveLobby = jasmine.createSpy('leaveLobby').and.returnValue(Promise.resolve());
  public leaveRoom = jasmine.createSpy('leaveRoom').and.returnValue(Promise.resolve());
  
  public getConnectionId = jasmine.createSpy('getConnectionId').and.returnValue('mock-conn-id');
  public checkIsHost = jasmine.createSpy('checkIsHost').and.returnValue(true);

  // Poppycock Methods
  public submitPoppycockDefinition = jasmine.createSpy('submitPoppycockDefinition');
  public submitPoppycockVote = jasmine.createSpy('submitPoppycockVote');

  // One And Only Methods
  public submitClue = jasmine.createSpy('submitClue');
  public submitGuess = jasmine.createSpy('submitGuess');
}
