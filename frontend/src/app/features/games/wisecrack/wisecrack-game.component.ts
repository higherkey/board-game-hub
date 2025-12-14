import { Component, Input, OnInit } from '@angular/core';
import { Room, SignalRService } from '../../../services/signalr.service';
import { CommonModule } from '@angular/common';
import { WisecrackBoardComponent } from './wisecrack-board.component';
import { WisecrackPlayerComponent } from './wisecrack-player.component';

@Component({
    selector: 'app-wisecrack-game',
    standalone: true,
    imports: [CommonModule, WisecrackBoardComponent, WisecrackPlayerComponent],
    template: `
    <div class="wisecrack-container w-full h-full flex flex-col">
      <!-- Header / Status Bar -->
      <div class="p-2 bg-gray-800 text-white flex justify-between items-center shrink-0">
        <span class="font-bold text-lg">Wisecrack</span>
        <span class="text-sm">Round {{room.roundNumber}}</span>
      </div>

      <!-- Main Content Area -->
      <div class="flex-grow overflow-hidden relative">
        <!-- Board View (Shared Screen) -->
        <app-wisecrack-board 
          *ngIf="isHost" 
          [room]="room">
        </app-wisecrack-board>
        
        <!-- Player View (Controller) -->
        <app-wisecrack-player
          *ngIf="!isHost"
          [room]="room"
          [playerId]="playerId">
        </app-wisecrack-player>
      </div>
    </div>
  `,
    styles: [`
    :host {
      display: block;
      height: 100%;
      width: 100%;
    }
  `]
})
export class WisecrackGameComponent implements OnInit {
    @Input() room!: Room;

    constructor(private readonly signalRService: SignalRService) { }

    get isHost(): boolean {
        const host = this.room.players.find(p => p.isHost);
        return this.playerId === host?.connectionId;
    }

    get playerId(): string {
        return this.signalRService.getConnectionId() || '';
    }

    ngOnInit(): void { }
}
