import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-checkers-game',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="container text-center py-5">
      <h2>Checkers</h2>
      <p>Implementation Coming Soon</p>
      <div *ngIf="room?.gameData as state">
        <p>Phase: {{ state.phase }}</p>
        <p>Current Player: {{ state.currentPlayerId }}</p>
      </div>
    </div>
  `
})
export class CheckersGameComponent {
    @Input() room: any;
    @Input() myConnectionId: string = '';
    @Input() isHost: boolean = false;
}
