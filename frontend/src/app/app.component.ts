import { Component, OnInit, ChangeDetectionStrategy, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, ActivatedRoute } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { ToastComponent } from './shared/components/toast/toast.component';
import { SignalRService } from './services/signalr.service';
import { GameDataService } from './services/game-data.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, ToastComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private readonly router: Router,
    private readonly titleService: Title,
    private readonly activatedRoute: ActivatedRoute,
    private readonly signalRService: SignalRService,
    private readonly gameDataService: GameDataService
  ) { }

  ngOnInit() {
    // 0. Pre-warm backend and games cache to eliminate cold-start latency
    this.gameDataService.warmup();

    // 2. Handle Game Room Titles (Dynamic)
    // This listener handles game-specific titles like "BGHub | Scatterbrain"
    // which change while staying on the same route (/game/:code).
    this.signalRService.currentRoom$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(room => {
      if (room) {
        const gameName = room.gameType || 'Game Room';
        this.titleService.setTitle(`BGHub | ${this.formatGameName(gameName)}`);
      }
      // Note: If room is null, the TitleStrategy will handle resetting the title 
      // when the user navigates away from the Game Room.
    });
  }

  private formatGameName(name: string): string {
    // Add spaces to PascalCase if needed, or just use as is. 
    // E.g. "SushiTrain" -> "Sushi Train"
    return name.replaceAll(/([A-Z])/g, ' $1').trim();
  }
}
