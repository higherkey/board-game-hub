import { Component, OnInit, Type, ViewChild, ElementRef } from '@angular/core';
import { CommonModule, NgComponentOutlet } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { SignalRService, GameSettings, Room, Player } from '../../services/signalr.service';
import { AuthService } from '../../services/auth.service';
import { GameBoardComponent } from '../game-board/game-board.component';
import { MobileControllerComponent } from '../mobile-controller/mobile-controller.component';
import { HostSettingsComponent } from './components/host-settings/host-settings.component';
import { VideoChatComponent } from './components/video-chat/video-chat.component';
import { GameReviewComponent } from './components/game-review/game-review.component';
import { SocialPanelComponent } from '../../shared/components/social-panel/social-panel.component';
import { map, Observable } from 'rxjs';
import { UndoToastComponent } from './components/undo-toast/undo-toast.component';
import { OneAndOnlyBoardComponent } from '../games/one-and-only/one-and-only-board.component';
import { OneAndOnlyPlayerComponent } from '../games/one-and-only/one-and-only-player.component';
import { BreakingNewsComponent } from '../games/breaking-news/breaking-news.component';
import { UniversalTranslatorComponent } from '../games/universal-translator/universal-translator.component';
import { PoppycockBoardComponent } from '../games/poppycock/poppycock-board.component';
import { PoppycockPlayerComponent } from '../games/poppycock/poppycock-player.component';
import { SymbologyComponent } from '../games/symbology/symbology.component';
import { WisecrackGameComponent } from '../games/wisecrack/wisecrack-game.component';
import { PictophoneGameComponent } from '../games/pictophone/pictophone-game.component';
import { DeepfakeGameComponent } from '../games/deepfake-game/deepfake-game.component';
import { BabbleComponent } from '../games/babble/babble.component';
import { SushiTrainComponent } from '../games/sushi-train/sushi-train.component';
import { SushiTrainPlayerComponent } from '../games/sushi-train/sushi-train-player.component';
import { GreatMindsGameComponent } from '../games/great-minds/great-minds.component';

@Component({
  selector: 'app-game-room',
  standalone: true,
  imports: [
    CommonModule,
    NgComponentOutlet,
    GameBoardComponent,
    MobileControllerComponent,
    HostSettingsComponent,
    VideoChatComponent,
    GameReviewComponent,
    SocialPanelComponent,
    UndoToastComponent,
    FormsModule
  ],
  templateUrl: './game-room.component.html',
  styleUrls: ['./game-room.component.scss']
})
export class GameRoomComponent implements OnInit {
  roomCode = '';
  showNamePrompt = false;
  promptPlayerName = '';
  players$: Observable<Player[]>;
  connectionStatus$: Observable<string>;
  gameStarted$: Observable<boolean>;
  isHost$: Observable<boolean>;
  currentRoom$: Observable<Room | null>; // Typed properly?

  // Dynamic Loading
  gameComponent: Type<any> | null = null;
  public gameInputs: Record<string, any> = {};

  mobileView: 'game' | 'players' = 'game';

  // Video Layout Integration
  public videoLayout: 'sidebar' | 'overlay' | 'docked-top' | 'docked-bottom' = 'sidebar';

  setMobileView(view: 'game' | 'players') {
    this.mobileView = view;
  }

  onVideoLayoutChange(mode: any) {
    this.videoLayout = mode;
  }

  constructor(
    private readonly route: ActivatedRoute,
    private readonly signalRService: SignalRService,
    private readonly router: Router,
    private readonly authService: AuthService
  ) {
    this.players$ = this.signalRService.players$;
    this.connectionStatus$ = this.signalRService.connectionStatus$;
    this.currentRoom$ = this.signalRService.currentRoom$;

    // Subscribe to room updates to select component
    this.currentRoom$.subscribe(room => {
      if (room) {
        this.updateActiveGame(room);
      }
    });

    // Game started if state is Playing or Finished
    this.gameStarted$ = this.currentRoom$.pipe(map(r => r?.state === 'Playing' || r?.state === 'Finished'));

    this.isHost$ = this.players$.pipe(map((all: Player[]) => {
      const myName = this.route.snapshot.queryParamMap.get('name');
      const me = all.find(p => p.name === myName);
      return me?.isHost || false;
    }));
  }

  ngOnInit() {
    this.roomCode = this.route.snapshot.paramMap.get('code') || '';
    this.signalRService.startConnection();

    // Auto-join if name param exists (e.g. from redirect) or if we have it in guest storage
    const nameParam = this.route.snapshot.queryParamMap.get('name');
    const guestName = this.authService.getGuestName();
    const currentRoom = this.signalRService.currentRoomSubject.value;

    const finalName = nameParam || guestName;

    // Only join if we aren't already in this room and have a name
    if (finalName) {
      if (!currentRoom || currentRoom.code !== this.roomCode) {
        this.signalRService.joinRoom(this.roomCode, finalName);
      }
    } else {
      // No name found anywhere -> show prompt
      this.showNamePrompt = true;
    }
  }

  submitGuestName() {
    if (!this.promptPlayerName) return;

    this.authService.setGuestName(this.promptPlayerName);
    this.showNamePrompt = false;
    this.signalRService.joinRoom(this.roomCode, this.promptPlayerName);
  }

  newPlayerName = '';
  isRenaming = false;

  startRename() {
    const myId = this.getMyConnectionId(this.signalRService.players$.value);
    const me = this.signalRService.players$.value.find(p => p.connectionId === myId);
    if (me) {
      this.newPlayerName = me.name;
      this.isRenaming = true;
    }
  }

  cancelRename() {
    this.isRenaming = false;
    this.newPlayerName = '';
  }

  submitRename() {
    const newName = this.newPlayerName?.trim();
    if (!newName || newName.length === 0) return;

    // Optimistic Update: Update local list immediately for better UX
    const currentPlayers = this.signalRService.players$.value;
    const myId = this.getMyConnectionId(currentPlayers);
    const me = currentPlayers.find(p => p.connectionId === myId);
    if (me) {
      me.name = newName;
      this.signalRService.players$.next([...currentPlayers]);
    }

    this.signalRService.renamePlayer(newName);
    this.authService.setGuestName(newName); // Persist new name
    this.isRenaming = false;
  }

  startGame(settings: GameSettings) {
    this.signalRService.startGame(settings);
  }

  onBabbleWordsUpdated(words: string[]) {
    this.signalRService.submitAnswers(words);
  }

  onClueSubmitted(clue: string) {
    this.signalRService.submitClue(clue);
  }

  onGuessSubmitted(guess: string) {
    this.signalRService.submitGuess(guess);
  }

  onPoppycockDefSubmitted(def: string) {
    this.signalRService.submitPoppycockDefinition(def);
  }

  onPoppycockVoteSubmitted(vote: string) {
    this.signalRService.submitPoppycockVote(vote);
  }

  getMyConnectionId(players: Player[] | null | undefined): string {
    // If we have direct access to connectionId via service, use it, otherwise fallback
    const directId = this.signalRService.getConnectionId();
    if (directId) return directId;

    const list = players || [];
    const myName = this.route.snapshot.queryParamMap.get('name');
    const me = list.find((p) => p.name === myName);
    return me?.connectionId || '';
  }

  @ViewChild('undoDialog') undoDialog!: ElementRef<HTMLDialogElement>;

  requestUndo() {
    this.undoDialog.nativeElement.showModal();
  }

  confirmUndo() {
    this.signalRService.requestUndo();
    this.undoDialog.nativeElement.close();
  }

  cancelUndo() {
    this.undoDialog.nativeElement.close();
  }

  async leaveRoom() {
    if (this.roomCode) {
      await this.signalRService.leaveRoom(this.roomCode);
    }
    this.router.navigate(['/games']);
  }

  private updateActiveGame(room: Room) { // Using 'any' for Room briefly to avoid import circle if specific type needed
    // Map GameType string to Component Class
    // We pass inputs: { room: room, myConnectionId: ... } typically
    // Each game component seems to take @Input() room.

    this.gameInputs = {
      room: room,
      myConnectionId: this.getMyConnectionId(room.players),
      // Some games take specific inputs like 'isHost', handle that?
      isHost: this.checkIsHost(room, this.getMyConnectionId(room.players))
    };

    // Select Component
    switch (room.gameType) {
      case 'Babble':
        this.gameComponent = BabbleComponent;
        break;
      case 'OneAndOnly':
        // Host vs Player logic? Or does OneAndOnlyBoardComponent handle both?
        // The original HTML showed OneAndOnlyBoardComponent for Host and OneAndOnlyPlayerComponent for Player.
        // This hybrid logic is tricky with a single Outlet.
        // IF the game components themselves can't handle role-switching, we might need a Wrapper.
        // For now, let's assume we load the BOARD if host, PLAYER if not?
        // Wait, the original HTML used *ngIf="isHost" checks *inside* the template to pick component.
        // That means we need logic here:
        if (this.checkIsHost(room, this.getMyConnectionId(room.players))) {
          this.gameComponent = OneAndOnlyBoardComponent;
        } else {
          this.gameComponent = OneAndOnlyPlayerComponent;
        }
        break;
      case 'GreatMinds':
        this.gameComponent = GreatMindsGameComponent; // This one handles both views internally
        break;
      case 'BreakingNews':
        this.gameComponent = BreakingNewsComponent;
        break;
      case 'UniversalTranslator':
        this.gameComponent = UniversalTranslatorComponent;
        break;
      case 'Poppycock':
        // Similar split logic?
        if (this.checkIsHost(room, this.getMyConnectionId(room.players)) && room.state !== 'Lobby') {
          // Assuming Board is for Host?
          this.gameComponent = PoppycockBoardComponent;
        } else {
          this.gameComponent = PoppycockPlayerComponent;
        }
        break;
      case 'Symbology':
        this.gameComponent = SymbologyComponent;
        break;
      case 'Wisecrack':
        this.gameComponent = WisecrackGameComponent;
        break;
      case 'Pictophone':
        this.gameComponent = PictophoneGameComponent;
        break;
      case 'Deepfake':
        this.gameComponent = DeepfakeGameComponent;
        break;
      case 'SushiTrain':
        // Original HTML used SushiTrainComponent (Board) and SushiTrainPlayerComponent (Player)?
        // Or maybe SushiTrainComponent handles everything?
        // Let's check imports: We imported both.
        if (this.checkIsHost(room, this.getMyConnectionId(room.players))) {
          this.gameComponent = SushiTrainComponent;
        } else {
          // Does PlayerComponent exist definitively? Yes.
          this.gameComponent = SushiTrainPlayerComponent;
        }
        break;
      default:
        this.gameComponent = null;
        break;
    }
  }

  private checkIsHost(room: Room, myId: string): boolean {
    return room.players.find((p) => p.connectionId === myId)?.isHost || false;
  }
}
