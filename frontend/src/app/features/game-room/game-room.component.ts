import { Component, OnInit, Type, ViewChild, ElementRef } from '@angular/core';
import { CommonModule, NgComponentOutlet } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { SignalRService, GameSettings, Room, Player } from '../../services/signalr.service';
import { AuthService } from '../../services/auth.service';
import { HostSettingsComponent } from './components/host-settings/host-settings.component';
import { VideoChatComponent } from './components/video-chat/video-chat.component';
import { GameReviewComponent } from './components/game-review/game-review.component';
import { SocialPanelComponent } from '../../shared/components/social-panel/social-panel.component';
import { map, Observable, take } from 'rxjs';
import { UndoToastComponent } from './components/undo-toast/undo-toast.component';
import { OneAndOnlyBoardComponent } from '../games/one-and-only/one-and-only-board.component';
import { OneAndOnlyPlayerComponent } from '../games/one-and-only/one-and-only-player.component';
import { GameDataService, GameDefinition } from '../../services/game-data.service';
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
import { ScatterbrainComponent } from '../games/scatterbrain/scatterbrain.component';
import { ToastService } from '../../shared/services/toast.service';

@Component({
  selector: 'app-game-room',
  standalone: true,
  imports: [
    CommonModule,
    NgComponentOutlet,
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
  isCreating = false;
  needsName = false;
  promptPlayerName = '';
  players$: Observable<Player[]>;
  connectionStatus$: Observable<string>;
  gameStarted$: Observable<boolean>;
  isHost$: Observable<boolean>;
  currentRoom$: Observable<Room | null>;

  // Creation options
  selectedGameType = 'None';
  isPublic = true;
  availableGames: GameDefinition[] = [];

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
    private readonly authService: AuthService,
    private readonly toastService: ToastService,
    private readonly gameDataService: GameDataService
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
      const myName = this.authService.getGuestName() || this.authService.currentUserValue?.displayName;
      const me = all.find(p => p.name === myName);
      return me?.isHost || false;
    }));
  }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.roomCode = params.get('code') || '';
      this.isCreating = this.roomCode === 'create';

      if (this.isCreating) {
        this.signalRService.clearState();
        this.needsName = true;
      }
    });

    this.signalRService.startConnection();

    // Load available games for creation
    this.gameDataService.loadGames().subscribe(games => {
      this.availableGames = games.filter(g => g.status === 'Deployed' || g.status === 'Testing');
    });

    // Check query params for pre-selected game or name
    this.route.queryParams.pipe(take(1)).subscribe(params => {
      if (params['gameType']) {
        this.selectedGameType = params['gameType'];
      }
      if (params['name']) {
        this.promptPlayerName = params['name'];
      }
    });

    const guestName = this.authService.getGuestName() || (this.authService.currentUserValue?.displayName);

    if (this.isCreating) {
      if (guestName) this.promptPlayerName = guestName;
      this.needsName = true; // Always show setup form when creating
    } else if (guestName) {
      this.autoJoin(guestName);
    } else {
      this.needsName = true;
    }
  }

  private autoJoin(name: string) {
    const currentRoom = this.signalRService.currentRoomSubject.value;
    if (!currentRoom || currentRoom.code !== this.roomCode) {
      this.signalRService.joinRoom(this.roomCode, name).then(success => {
        if (!success) {
          this.toastService.showError(`Room ${this.roomCode} not found or no longer active.`);
          this.signalRService.removeActiveRoom(this.roomCode);
          this.router.navigate(['/games']);
        }
      });
    }
  }

  async submitEntry() {
    if (!this.promptPlayerName) return;

    this.authService.setGuestName(this.promptPlayerName);
    this.needsName = false;

    if (this.isCreating) {
      try {
        const newCode = await this.signalRService.createRoom(
          this.promptPlayerName,
          this.isPublic,
          this.selectedGameType
        );
        this.router.navigate(['/game', newCode]);
      } catch (err) {
        console.error('Failed to create room', err);
        this.toastService.showError('Failed to create room.');
        this.needsName = true;
      }
    } else {
      await this.signalRService.joinRoom(this.roomCode, this.promptPlayerName);
    }
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

  onGuessSubmitted(event: { guess: string, isPass: boolean } | string) {
    if (typeof event === 'string') {
      this.signalRService.submitGuess(event);
    } else {
      this.signalRService.submitGuess(event.guess, event.isPass);
    }
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
    const myName = this.authService.getGuestName() || this.authService.currentUserValue?.displayName;
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
      case 'Scatterbrain':
        this.gameComponent = ScatterbrainComponent;
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
