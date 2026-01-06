import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NomDeCodeBoardComponent } from '../nom-de-code-board/nom-de-code-board.component';
import { NomDeCodePlayerComponent } from '../nom-de-code-player/nom-de-code-player.component';
import { NomDeCodeRulesComponent } from '../nom-de-code-rules/nom-de-code-rules.component';

@Component({
  selector: 'app-nom-de-code-game',
  standalone: true,
  imports: [CommonModule, NomDeCodeBoardComponent, NomDeCodePlayerComponent, NomDeCodeRulesComponent],
  templateUrl: './nom-de-code-game.component.html',
  styleUrls: ['./nom-de-code-game.component.scss']
})
export class NomDeCodeGameComponent {
  @Input() room: any;
  @Input() myConnectionId: string = '';
  @Input() isHost: boolean = false;
  showRules = false;
}
