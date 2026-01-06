import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-nom-de-code-game',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="container text-center py-5">
      <h2>Nom De Code</h2>
      <p>Implementation Coming Soon</p>
      <div *ngIf="room?.gameData as state">
        <p>Current Team: {{ state.currentTeam }}</p>
        <p>Phase: {{ state.phase }}</p>
      </div>
    </div>
  `,
    styles: []
})
export class NomDeCodeGameComponent {
    @Input() room: any;
    @Input() myConnectionId: string = '';
    @Input() isHost: boolean = false;
}
