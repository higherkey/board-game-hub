import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WarshipsBoardComponent } from '../warships-board/warships-board.component';
import { WarshipsPlayerComponent } from '../warships-player/warships-player.component';
import { WarshipsRulesComponent } from '../warships-rules/warships-rules.component';

@Component({
  selector: 'app-warships-game',
  standalone: true,
  imports: [CommonModule, WarshipsBoardComponent, WarshipsPlayerComponent, WarshipsRulesComponent],
  templateUrl: './warships-game.component.html',
  styleUrls: ['./warships-game.component.scss']
})
export class WarshipsGameComponent {
  @Input() room: any;
  @Input() myConnectionId: string = '';
  @Input() isHost: boolean = false;
  showRules = false;
}
