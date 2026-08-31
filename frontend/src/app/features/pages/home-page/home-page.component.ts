import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { GameDataService, GameDefinition } from '../../../services/game-data.service';
import { SignalRService } from '../../../services/signalr.service';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss'
})
export class LandingPageComponent implements OnInit {
  featuredGames: GameDefinition[] = [];
  roomCode: string = '';
  isCodeInputFocused: boolean = false;
  isValidating: boolean = false;
  codeError: string | null = null;

  @ViewChild('codeInput') codeInputRef?: ElementRef<HTMLInputElement>;

  constructor(
    private readonly gameDataService: GameDataService,
    private readonly signalRService: SignalRService,
    private readonly router: Router
  ) {}

  toggleCodeEntry(): void {
    if (this.isCodeInputFocused) {
      this.isCodeInputFocused = false;
      this.roomCode = '';
      this.codeError = null;
    } else {
      this.isCodeInputFocused = true;
      this.codeError = null;
      // Auto-focus the input after the tray appears
      setTimeout(() => this.codeInputRef?.nativeElement.focus(), 50);
    }
  }


  async onJoinBtnClick(): Promise<void> {
    const cleanCode = this.roomCode ? this.roomCode.trim().toUpperCase() : '';
    // If no 4-letter code is entered, navigate directly to /play (Public Lobbies / Room Finder)
    if (!cleanCode || cleanCode.length < 4) {
      this.router.navigate(['/play']);
      return;
    }

    // A 4-letter code was typed -> validate it before connecting
    this.isValidating = true;
    this.codeError = null;

    try {
      const isValid = await this.signalRService.validateRoomCode(cleanCode);
      if (isValid) {
        this.router.navigate(['/game', cleanCode]);
      } else {
        this.codeError = `Room "${cleanCode}" not found. Check code or click Join to browse rooms.`;
      }
    } catch (err) {
      this.codeError = 'Unable to verify room code right now. Please try again.';
    } finally {
      this.isValidating = false;
    }
  }

  onCodeInput(): void {
    this.codeError = null;
  }

  onCodeFocus(): void {
    this.isCodeInputFocused = true;
    this.codeError = null;
  }

  onCodeBlur(): void {
    // Only close if the tray input loses focus AND no code was typed
    // Delay to allow click on the Go button to fire first
    setTimeout(() => {
      if (!this.roomCode || this.roomCode.trim().length === 0) {
        this.isCodeInputFocused = false;
      }
    }, 200);
  }

  ngOnInit(): void {
    this.gameDataService.games$.subscribe(games => {
      if (games) {
        const visibleStatuses = new Set(['Deployed', 'Testing']);
        this.featuredGames = games
          .filter(g => visibleStatuses.has(g.status))
          .slice(0, 3);
      }
    });

    this.gameDataService.refreshGames();
  }
}

