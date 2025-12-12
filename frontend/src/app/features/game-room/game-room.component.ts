import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { SignalRService, GameSettings } from '../../services/signalr.service';
import { GameBoardComponent } from '../game-board/game-board.component';
import { MobileControllerComponent } from '../mobile-controller/mobile-controller.component';
import { HostSettingsComponent } from './components/host-settings/host-settings.component';
import { VideoChatComponent } from './components/video-chat/video-chat.component';
import { BoggleComponent } from '../games/boggle.component';
import { GameReviewComponent } from './components/game-review/game-review.component';
import { SocialPanelComponent } from '../../shared/components/social-panel/social-panel.component';
import { map, Observable } from 'rxjs';
import { JustOneBoardComponent } from '../games/just-one/just-one-board.component';
import { JustOnePlayerComponent } from '../games/just-one/just-one-player.component';

@Component({
  selector: 'app-game-room',
  standalone: true,
  imports: [
    CommonModule,
    GameBoardComponent,
    MobileControllerComponent,
    HostSettingsComponent,
    VideoChatComponent,
    BoggleComponent,
    GameReviewComponent,
    SocialPanelComponent,
    JustOneBoardComponent,
    JustOnePlayerComponent
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
    if (name) {
      this.signalRService.joinRoom(this.roomCode, name);
    }
  }

  startGame(settings: GameSettings) {
    this.signalRService.startGame(settings);
  }

  onBoggleWordsUpdated(words: string[]) {
    this.signalRService.submitAnswers(words);
  }

  onClueSubmitted(clue: string) {
    this.signalRService.submitClue(clue);
  }

  onGuessSubmitted(guess: string) {
    this.signalRService.submitGuess(guess);
  }

  getMyConnectionId(players: any[] | null): string {
    const list = players || [];
    const myName = this.route.snapshot.queryParamMap.get('name');
    const me = list.find(p => p.name === myName);
    return me?.connectionId || '';
  }

  async leaveRoom() {
    if (this.roomCode) {
      await this.signalRService.leaveRoom(this.roomCode);
    }
    this.router.navigate(['/games']);
  }
}
