import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SignalRService } from '../../../../services/signalr.service';

@Component({
  selector: 'app-undo-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './undo-toast.component.html',
  styleUrls: ['./undo-toast.component.scss']
})
export class UndoToastComponent {
  @Input() vote: any;
  @Input() currentUserId: string = '';
  @Input() totalPlayers: number = 0;

  constructor(private readonly signalR: SignalRService) { }

  get yesCount(): number {
    if (!this.vote?.votes) return 0;
    return Object.values(this.vote.votes).filter(v => v === true).length;
  }

  get hasVoted(): boolean {
    if (!this.vote?.votes || !this.currentUserId) return false;
    return this.vote.votes.hasOwnProperty(this.currentUserId);
  }

  get myVote(): boolean {
    return this.vote.votes[this.currentUserId] === true;
  }

  castVote(agree: boolean) {
    this.signalR.submitUndoVote(agree);
  }
}
