import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Room, SignalRService } from '../../../services/signalr.service';

@Component({
  selector: 'app-wisecrack-board',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './wisecrack-board.component.html',
  styleUrls: ['./wisecrack-board.component.scss']
})
export class WisecrackBoardComponent {
  @Input() room!: Room;
  @Input() isHost: boolean = false;

  constructor(private readonly signalRService: SignalRService) { }

  get state(): any {
    return this.room.gameData;
  }

  get isWriting(): boolean {
    return this.state?.phase === 'Writing';
  }

  get isBattling(): boolean {
    return this.state?.phase === 'Battling';
  }

  get isResult(): boolean {
    return this.state?.phase === 'Result';
  }

  get answerCount(): number {
    return this.state?.answers?.length || 0;
  }

  get expectedAnswers(): number {
    return (this.room.players.length || 0) * 2;
  }

  get currentBattle(): any {
    return this.state?.battles?.[this.state.currentBattleIndex];
  }

  get battleWinner(): string | null {
    if (!this.currentBattle?.isFinished) return null;
    if (this.currentBattle.winnerPlayerId === 'TIE') return 'TIE';
    if (this.currentBattle.winnerPlayerId === this.currentBattle.answerA.playerId) return 'A';
    if (this.currentBattle.winnerPlayerId === this.currentBattle.answerB.playerId) return 'B';
    return null;
  }

  // Count how many prompts this user has finished.
  // We need to look at state.answers list.
  hasSubmitted(userIdOrConnId: string): boolean {
    if (!this.state?.answers) return false;
    // Each player needs to answer 2 prompts?
    // Let's count answers.
    const myAnswers = this.state.answers.filter((a: any) => a.playerId === userIdOrConnId || a.id === userIdOrConnId);
    // Usually mapped by ConnectionId in simple mode
    return myAnswers.length >= 2;
  }

  getVotes(option: 'A' | 'B'): number {
    if (!this.currentBattle) return 0;
    const choice = option === 'A' ? 0 : 1;
    return this.currentBattle.votes.filter((v: any) => v.choice === choice).length;
  }

  get sortedPlayers(): any[] {
    return [...this.room.players].sort((a, b) => b.score - a.score);
  }

  nextBattle() {
    this.signalRService.nextWisecrackBattle();
  }

  nextRound() {
    this.signalRService.nextRound();
  }

  endGame() {
    this.signalRService.endGame();
  }
}
