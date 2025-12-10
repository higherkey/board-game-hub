import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SignalRService } from '../../services/signalr.service';
import { Observable, map, timer } from 'rxjs';

@Component({
  selector: 'app-mobile-controller',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="mobile-container p-3">
        <!-- Sticky Header with Letter and Timer -->
        <div class="sticky-top bg-surface shadow-sm rounded p-3 mb-3 d-flex justify-content-between align-items-center" style="border: 1px solid var(--bg-surface-2);">
             <div class="d-flex align-items-center gap-2">
                <div class="badge bg-dark fs-4">{{ (room$ | async)?.gameState?.currentLetter }}</div>
                <div class="small fw-bold text-secondary text-uppercase">Letter</div>
             </div>
             <div>
                <span class="fs-4 fw-bold" [class.text-danger]="(timeLeft$ | async)! < 10">{{ timeLeft$ | async }}s</span>
             </div>
        </div>
        
        <form>
            <div class="mb-3" *ngFor="let cat of (room$ | async)?.gameState?.categories; let i = index">
                <label [for]="'cat'+i" class="form-label small fw-bold text-primary">{{i+1}}. {{cat}}</label>
                <input type="text" [id]="'cat'+i" class="form-control form-control-lg" [(ngModel)]="answers[i]" [name]="'cat'+i" placeholder="Answer..." autocomplete="off">
            </div>
            
            <button type="submit" class="btn btn-success btn-lg w-100 mt-3 mb-5 py-3 fw-bold shadow">
                SUBMIT ANSWERS <i class="bi bi-send-fill ms-2" aria-hidden="true"></i>
            </button>
        </form>
    </div>
  `
})
export class MobileControllerComponent {
  @Input() roomCode = '';
  room$: Observable<any>;
  timeLeft$: Observable<number>;
  answers: string[] = [];

  constructor(private readonly signalRService: SignalRService) {
    this.room$ = this.signalRService.currentRoom$;

    // Duplicate timer logic for player view
    this.timeLeft$ = timer(0, 1000).pipe(
      map(x => {
        const room = this.signalRService.currentRoomSubject.value;
        if (!room?.roundEndTime) return 0;
        const end = new Date(room.roundEndTime).getTime();
        const now = Date.now();
        return Math.max(0, Math.ceil((end - now) / 1000));
      })
    );
  }
}
