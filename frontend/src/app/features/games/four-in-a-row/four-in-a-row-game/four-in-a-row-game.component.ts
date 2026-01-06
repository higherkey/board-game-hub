import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FourInARowBoardComponent } from '../four-in-a-row-board/four-in-a-row-board.component';
import { FourInARowPlayerComponent } from '../four-in-a-row-player/four-in-a-row-player.component';
import { FourInARowRulesComponent } from '../four-in-a-row-rules/four-in-a-row-rules.component';

@Component({
  selector: 'app-four-in-a-row-game',
  standalone: true,
  imports: [CommonModule, FourInARowBoardComponent, FourInARowPlayerComponent, FourInARowRulesComponent],
  templateUrl: './four-in-a-row-game.component.html',
  styleUrls: ['./four-in-a-row-game.component.scss']
})
export class FourInARowGameComponent {
  @Input() room: any;
  @Input() myConnectionId: string = '';
  @Input() isHost: boolean = false;
  showRules = false;
}
