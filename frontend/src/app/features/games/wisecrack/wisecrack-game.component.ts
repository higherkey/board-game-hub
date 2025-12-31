import { Component, Input, OnInit } from '@angular/core';
import { Room, SignalRService } from '../../../services/signalr.service';
import { CommonModule } from '@angular/common';
import { WisecrackBoardComponent } from './wisecrack-board.component';
import { WisecrackPlayerComponent } from './wisecrack-player.component';
import { WisecrackRulesComponent } from './wisecrack-rules.component';

@Component({
  selector: 'app-wisecrack-game',
  standalone: true,
  imports: [CommonModule, WisecrackBoardComponent, WisecrackPlayerComponent, WisecrackRulesComponent],
  templateUrl: './wisecrack-game.component.html',
  styleUrls: ['./wisecrack-game.component.scss']
})
export class WisecrackGameComponent implements OnInit {
  @Input() room!: Room;
  @Input() myConnectionId: string = '';
  @Input() isHost: boolean = false;
  showRules = false;

  constructor(private readonly signalRService: SignalRService) { }

  get playerId(): string {
    return this.myConnectionId;
  }

  ngOnInit(): void {
    // Show rules by default if we just started
    if (this.room.roundNumber === 1 && !this.room.gameData) {
      this.showRules = true;
    }
  }
}
