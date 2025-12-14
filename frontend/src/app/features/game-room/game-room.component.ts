import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { SignalRService, GameSettings } from '../../services/signalr.service';
import { GameBoardComponent } from '../game-board/game-board.component';
import { MobileControllerComponent } from '../mobile-controller/mobile-controller.component';
import { HostSettingsComponent } from './components/host-settings/host-settings.component';
import { VideoChatComponent } from './components/video-chat/video-chat.component';
import { BabbleComponent } from '../games/babble/babble.component';
import { GameReviewComponent } from './components/game-review/game-review.component';
import { SocialPanelComponent } from '../../shared/components/social-panel/social-panel.component';
import { map, Observable } from 'rxjs';
import { OneAndOnlyBoardComponent } from '../games/one-and-only/one-and-only-board.component';
import { OneAndOnlyPlayerComponent } from '../games/one-and-only/one-and-only-player.component';
import { UndoToastComponent } from './components/undo-toast/undo-toast.component';
import { BreakingNewsComponent } from '../games/breaking-news/breaking-news.component';
import { UniversalTranslatorComponent } from '../games/universal-translator/universal-translator.component';
import { PoppycockBoardComponent } from '../games/poppycock/poppycock-board.component';
import { PoppycockPlayerComponent } from '../games/poppycock/poppycock-player.component';
import { SymbologyComponent } from '../games/symbology/symbology.component';
import { WisecrackGameComponent } from '../games/wisecrack/wisecrack-game.component';
import { PictophoneGameComponent } from '../games/pictophone/pictophone-game.component';
import { DeepfakeGameComponent } from '../games/deepfake-game/deepfake-game.component';
import { SushiTrainComponent } from '../games/sushi-train/sushi-train.component';
import { SushiTrainPlayerComponent } from '../games/sushi-train/sushi-train-player.component';
import { GreatMindsGameComponent } from '../games/great-minds/great-minds.component';

@Component({
  selector: 'app-game-room',
  standalone: true,
  imports: [
    CommonModule,
    GameBoardComponent,
    MobileControllerComponent,
    HostSettingsComponent,
    VideoChatComponent,
    BabbleComponent,
    GameReviewComponent,
    SocialPanelComponent,
    OneAndOnlyBoardComponent,
    OneAndOnlyPlayerComponent,
    BreakingNewsComponent,
    UndoToastComponent,
    UniversalTranslatorComponent,
    PoppycockBoardComponent,
    PoppycockPlayerComponent,
    SymbologyComponent,
    WisecrackGameComponent,
    PictophoneGameComponent,
    PictophoneGameComponent,
    DeepfakeGameComponent,
    SushiTrainComponent,
    SushiTrainPlayerComponent
  ],
  templateUrl: './game-room.component.html',
  styleUrls: ['./game-room.component.scss']
})
export class GameRoomComponent implements OnInit {
  roomCode = '';
  players$: Observable<any[]>;
  connectionStatus$: Observable<string>;
  gameStarted$: Observable<boolean>;
  isHost$: Observable<boolean>;
  currentRoom$: Observable<any>;

  mobileView: 'game' | 'players' = 'game';

  setMobileView(view: 'game' | 'players') {
    this.mobileView = view;
  }

  constructor(
    private readonly route: ActivatedRoute,
    private readonly signalRService: SignalRService,
    private readonly router: Router
  ) {
    this.players$ = this.signalRService.players$;
    this.connectionStatus$ = this.signalRService.connectionStatus$;
    this.currentRoom$ = this.signalRService.currentRoom$;

    // Game started if state is Playing or Finished
    this.gameStarted$ = this.signalRService.currentRoom$.pipe(map(r => r?.state === 'Playing' || r?.state === 'Finished'));

    this.isHost$ = this.players$.pipe(map((all: any[]) => {
      const myName = this.route.snapshot.queryParamMap.get('name');
      const me = all.find(p => p.name === myName);
      return me?.isHost || false;
    }));
  }

  ngOnInit() {
    this.roomCode = this.route.snapshot.paramMap.get('code') || '';
    this.signalRService.startConnection();

    // Auto-join if name param exists (e.g. from redirect)
    const name = this.route.snapshot.queryParamMap.get('name');
    const currentRoom = this.signalRService.currentRoomSubject.value;

    // Only join if we aren't already in this room
    if (name && (!currentRoom || currentRoom.code !== this.roomCode)) {
      this.signalRService.joinRoom(this.roomCode, name);
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

  onGuessSubmitted(guess: string) {
    this.signalRService.submitGuess(guess);
  }

  onPoppycockDefSubmitted(def: string) {
    this.signalRService.submitPoppycockDefinition(def);
  }

  onPoppycockVoteSubmitted(vote: string) {
    this.signalRService.submitPoppycockVote(vote);
  }

  getMyConnectionId(players: any[] | null): string {
    // If we have direct access to connectionId via service, use it, otherwise fallback
    const directId = this.signalRService.getConnectionId();
    if (directId) return directId;

    const list = players || [];
    const myName = this.route.snapshot.queryParamMap.get('name');
    const me = list.find(p => p.name === myName);
    return me?.connectionId || '';
  }

  requestUndo() {
    if (confirm('Are you sure you want to request an undo?')) {
      this.signalRService.requestUndo();
    }
  }

  async leaveRoom() {
    if (this.roomCode) {
      await this.signalRService.leaveRoom(this.roomCode);
    }
    this.router.navigate(['/games']);
  }
}
