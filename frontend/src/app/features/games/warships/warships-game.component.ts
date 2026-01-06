import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-warships-game',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="container text-center py-5">
      <h2>Warships</h2>
      <p>Implementation Coming Soon</p>
      <div *ngIf="room?.gameData as state">
        <p>Phase: {{ state.phase }}</p>
      </div>
    </div>
  `
})
export class WarshipsGameComponent {
    @Input() room: any;
    @Input() myConnectionId: string = '';
    @Input() isHost: boolean = false;
}
