import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SignalRService } from '../../../../services/signalr.service';

@Component({
    selector: 'app-undo-toast',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="undo-toast" *ngIf="vote">
      <div class="content">
        <div class="header">
          <span class="icon">⏪</span>
          <strong>Undo Requested</strong>
        </div>
        <p class="mb-2">{{ vote.initiatorName }} wants to undo the last move.</p>
        
        <div class="vote-status mb-2">
            <small>Votes: {{ yesCount }} / {{ totalPlayers }}</small>
            <div class="progress" style="height: 4px;">
                <div class="progress-bar bg-success" [style.width.%]="(yesCount / totalPlayers) * 100"></div>
            </div>
        </div>

        <div class="actions d-flex gap-2 justify-content-center" *ngIf="!hasVoted">
          <button class="btn btn-sm btn-success flex-grow-1" (click)="castVote(true)">Yes (Allow)</button>
          <button class="btn btn-sm btn-secondary flex-grow-1" (click)="castVote(false)">No</button>
        </div>
        <div class="text-center text-muted" *ngIf="hasVoted">
            <small>You voted {{ myVote ? 'Yes' : 'No' }}</small>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .undo-toast {
      position: fixed;
      top: 80px; /* Below Navbar */
      right: 20px;
      width: 300px;
      background: var(--surface-card);
      border: 1px solid var(--border-color);
      box-shadow: var(--shadow-lg);
      border-radius: 12px;
      padding: 1rem;
      z-index: 1050;
      animation: slideIn 0.3s ease-out;
    }

    .header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
      color: var(--text-primary);
    }

    .icon {
      font-size: 1.2rem;
    }

    .vote-status {
        background: var(--surface-ground);
        padding: 0.5rem;
        border-radius: 6px;
    }

    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `]
})
export class UndoToastComponent {
    @Input() vote: any;
    @Input() currentUserId: string = '';
    @Input() totalPlayers: number = 0;

    constructor(private signalR: SignalRService) { }

    get yesCount(): number {
        if (!this.vote || !this.vote.votes) return 0;
        return Object.values(this.vote.votes).filter(v => v === true).length;
    }

    get hasVoted(): boolean {
        if (!this.vote || !this.vote.votes || !this.currentUserId) return false;
        return this.vote.votes.hasOwnProperty(this.currentUserId);
    }

    get myVote(): boolean {
        return this.vote.votes[this.currentUserId] === true;
    }

    castVote(agree: boolean) {
        this.signalR.submitUndoVote(agree);
    }
}
