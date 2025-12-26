import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, ActivatedRoute } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { ToastComponent } from './shared/components/toast/toast.component';
import { ActiveGamesComponent } from './features/active-games/active-games.component';
import { SignalRService } from './services/signalr.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, ToastComponent, ActiveGamesComponent],
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit {
  constructor(
    private readonly router: Router,
    private readonly titleService: Title,
    private readonly activatedRoute: ActivatedRoute,
    private readonly signalRService: SignalRService
  ) { }

  ngOnInit() {
    // 0. Check for Backend Port (Admin Dashboard Deployment) logic removed.
    if (globalThis.location.port !== '4200') {
      this.isBackendPort = true;
    }

    // 2. Handle Game Room Titles (Dynamic)
    // This listener handles game-specific titles like "BGHub | Scatterbrain"
    // which change while staying on the same route (/game/:code).
    this.signalRService.currentRoom$.subscribe(room => {
      if (room) {
        const gameName = room.gameType || 'Game Room';
        this.titleService.setTitle(`BGHub | ${this.formatGameName(gameName)}`);
      }
      // Note: If room is null, the TitleStrategy will handle resetting the title 
      // when the user navigates away from the Game Room.
    });
  }

  isBackendPort = false;

  private formatGameName(name: string): string {
    // Add spaces to PascalCase if needed, or just use as is. 
    // E.g. "SushiTrain" -> "Sushi Train"
    return name.replaceAll(/([A-Z])/g, ' $1').trim();
  }
}
