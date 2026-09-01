import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Room, SignalRService } from '../../../../services/signalr.service';

@Component({
  selector: 'app-wisecrack-player',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './wisecrack-player.component.html',
  styleUrls: ['./wisecrack-player.component.scss']
})
export class WisecrackPlayerComponent {
  @Input() room!: Room;
  @Input() myConnectionId: string = '';
  @Input() isHost: boolean = false;
  @Input() set playerId(v: string) {
    if (v) this.myConnectionId = v;
  }

  inputs: { [key: string]: string } = {};
  votedChoice: number | null = null;

  constructor(private readonly signalRService: SignalRService) { }

  get myId(): string {
    return this.myConnectionId;
  }

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

  get myAssignments(): any[] {
    if (!this.state?.assignments) return [];
    return this.state.assignments.filter((a: any) => a.assignedPlayerIds.includes(this.myId));
  }

  hasAnswered(promptId: string): boolean {
    const submitted = this.state?.answers?.some((a: any) => a.promptId === promptId && a.playerId === this.myId);
    return submitted;
  }

  get allAnswered(): boolean {
    if (this.myAssignments.length === 0) return false;
    return this.myAssignments.every(a => this.hasAnswered(a.promptId));
  }

  submitAnswer(promptId: string) {
    const val = this.inputs[promptId];
    if (!val) return;
    this.signalRService.submitWisecrackAnswer(promptId, val);
  }

  // Voting
  get currentBattle(): any {
    return this.state?.battles?.[this.state.currentBattleIndex];
  }

  get canVote(): boolean {
    if (!this.currentBattle) return false;
    // Cannot vote if I am one of the answerers
    if (this.currentBattle.answerA.playerId === this.myId) return false;
    if (this.currentBattle.answerB.playerId === this.myId) return false;
    if (this.currentBattle.isFinished) return false;
    return true;
  }

  get hasVoted(): boolean {
    if (!this.currentBattle) return false;
    const voted = this.currentBattle.votes?.some((v: any) => v.playerId === this.myId);
    return voted;
  }

  vote(choice: number) {
    this.votedChoice = choice;
    this.signalRService.submitWisecrackVote(choice);
  }

  pauseGame() {
    this.signalRService.pauseGame();
  }

  resumeGame() {
    this.signalRService.resumeGame();
  }

  endRound() {
    this.signalRService.endRound();
  }
}
