import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CheckersBoardComponent } from '../checkers-board/checkers-board.component';
import { CheckersPlayerComponent } from '../checkers-player/checkers-player.component';
import { CheckersRulesComponent } from '../checkers-rules/checkers-rules.component';

@Component({
  selector: 'app-checkers-game',
  standalone: true,
  imports: [CommonModule, CheckersBoardComponent, CheckersPlayerComponent, CheckersRulesComponent],
  templateUrl: './checkers-game.component.html',
  styleUrls: ['./checkers-game.component.scss']
})
export class CheckersGameComponent {
  @Input() room: any;
  @Input() myConnectionId: string = '';
  @Input() isHost: boolean = false;
  showRules = false;
}
