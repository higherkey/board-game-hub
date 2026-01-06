import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { SocialPanelComponent } from '../../../shared/components/social-panel/social-panel.component';
import { GameDataService, GameDefinition } from '../../../services/game-data.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-social',
  standalone: true,
  imports: [CommonModule, PageHeaderComponent, SocialPanelComponent, RouterModule],
  templateUrl: './social.component.html',
  styleUrls: ['./social.component.scss']
})
export class SocialComponent {
  games$: Observable<GameDefinition[] | null>;

  constructor(private readonly gameDataService: GameDataService) {
    this.games$ = this.gameDataService.games$;
    this.gameDataService.refreshGames();
  }
}
