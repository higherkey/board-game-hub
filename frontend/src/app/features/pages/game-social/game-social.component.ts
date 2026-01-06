
import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { GameDataService, GameDefinition } from '../../../services/game-data.service';

@Component({
  selector: 'app-game-social',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="container py-5 mt-5">
      <div class="row justify-content-center">
        <div class="col-lg-8">
          <div class="card border-0 shadow-lg rounded-4 overflow-hidden">
            <div class="card-header bg-gradient-brand text-white p-4 text-center">
              <div class="d-flex align-items-center justify-content-center gap-3 mb-2">
                <span class="fs-1 drop-shadow">{{ game?.icon }}</span>
                <h1 class="m-0 fw-black text-uppercase letter-spacing-2 text-shadow">{{ game?.name }} Social Hub</h1>
              </div>
              <p class="mb-0 opacity-90 fw-medium">Connect with other players, share custom content, and join the community!</p>
            </div>
            <div class="card-body p-5 text-center">
              <div class="py-5">
                <i class="bi bi-hammer text-primary" style="font-size: 5rem;"></i>
                <h2 class="mt-4 fw-bold">Under Construction</h2>
                <p class="text-secondary fs-5">We're building something amazing here. Soon you'll be able to share your custom content for {{ game?.name }} and connect with players around the world.</p>
                
                <div class="mt-5 p-4 bg-surface-2 rounded-4 border">
                  <h5 class="fw-bold mb-3"><i class="bi bi-lightbulb me-2 text-warning"></i>Coming Soon:</h5>
                  <ul class="list-unstyled text-start d-inline-block">
                    <li class="mb-2"><i class="bi bi-check-circle-fill text-success me-2"></i> Custom Content Sharing</li>
                    <li class="mb-2"><i class="bi bi-check-circle-fill text-success me-2"></i> Community High Scores</li>
                    <li class="mb-2"><i class="bi bi-check-circle-fill text-success me-2"></i> Player Recommendations</li>
                    <li><i class="bi bi-check-circle-fill text-success me-2"></i> Live Discord Integration</li>
                  </ul>
                </div>

                <button (click)="goBack()" class="btn btn-primary btn-lg mt-5 rounded-pill px-5 fw-bold">
                  <i class="bi bi-arrow-left me-2"></i> GO BACK
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .bg-gradient-brand {
      background: linear-gradient(135deg, var(--primary-dark, #0a58ca) 0%, var(--accent-dark, #4b0bb8) 100%);
    }
    .text-shadow { text-shadow: 0 2px 4px rgba(0,0,0,0.3); }
    .drop-shadow { filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3)); }
    .letter-spacing-2 { letter-spacing: 2px; }
    .bg-surface-2 { background-color: var(--surface-2, #f8f9fa); }
    .fw-black { font-weight: 900; }
  `]
})
export class GameSocialComponent implements OnInit {
  gameId: string | null = null;
  game: GameDefinition | undefined;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly gameDataService: GameDataService,
    private readonly location: Location
  ) { }

  ngOnInit() {
    this.gameId = this.route.snapshot.paramMap.get('gameId');
    if (this.gameId) {
      this.gameDataService.games$.subscribe(games => {
        if (games) {
          this.game = games.find(g => g.id === this.gameId);
        }
      });
    }
  }

  goBack() {
    this.location.back();
  }
}
