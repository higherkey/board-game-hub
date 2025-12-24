import { Component, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SignalRService } from '../../services/signalr.service';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';

@Component({
    selector: 'app-active-games',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="active-games-container" [class.open]="isOpen">
        <button class="active-tables-btn" (click)="toggle($event)" [title]="isOpen ? 'Close' : 'View active tables'">
            <i class="bi bi-controller fs-5"></i>
            <span class="btn-text">Active Tables</span>
            <span class="badge rounded-pill bg-danger" *ngIf="(count$ | async) as count">{{ count > 0 ? count : '' }}</span>
        </button>

        <div class="active-tables-dropdown shadow-lg" *ngIf="isOpen">
            <div class="list-body">
                <div *ngFor="let room of activeRooms$ | async" class="game-item" (click)="joinRoom(room.code)">
                    <div class="game-info">
                        <span class="game-type">{{ room.gameType }}</span>
                        <span class="room-code">#{{ room.code }}</span>
                    </div>
                    <div class="actions">
                        <button class="join-icon-btn" title="Rejoin">
                            <i class="bi bi-arrow-right-short fs-4"></i>
                        </button>
                        <button class="remove-btn" 
                                (click)="removeRoom(room.code, $event)" 
                                title="Remove from list">
                            <i class="bi bi-trash3"></i>
                        </button>
                    </div>
                </div>

                <div *ngIf="(activeRooms$ | async)?.length === 0" class="empty-state">
                    <i class="bi bi-ghost fs-3 mb-2 d-block text-muted"></i>
                    <small>No active tables found</small>
                </div>
            </div>
        </div>
    </div>
  `,
    styles: [`
    :host {
        display: block;
    }

    .active-games-container {
        position: relative;
        font-family: 'Outfit', sans-serif;
    }

    .active-tables-btn {
        background: var(--primary);
        color: #fff;
        border: 2px solid rgba(255,255,255,0.1);
        border-radius: var(--radius-pill);
        padding: 5px 16px;
        display: flex;
        align-items: center;
        gap: 10px;
        cursor: pointer;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        white-space: nowrap;
        outline: none;
    }

    .active-tables-btn:hover {
        background: var(--primary-light);
        border-color: var(--accent);
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    }

    .active-games-container.open .active-tables-btn {
        background: var(--primary-light);
        border-color: var(--accent);
    }

    .active-tables-btn .btn-text {
        font-weight: 700;
        font-size: 0.85rem;
        letter-spacing: 0.02em;
    }

    .active-tables-dropdown {
        position: absolute;
        top: calc(100% + 12px);
        right: 0;
        width: 280px;
        background: var(--primary-dark);
        border: 2px solid var(--primary);
        border-radius: var(--radius-md);
        overflow: hidden;
        z-index: 1000;
        animation: dropIn 0.2s cubic-bezier(0, 0, 0.2, 1);
        box-shadow: 0 10px 25px rgba(0,0,0,0.4), var(--shadow-lg);
    }

    @keyframes dropIn {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
    }

    .list-body {
        max-height: 400px;
        overflow-y: auto;
        background: var(--primary-dark);
    }

    .game-item {
        padding: 12px 16px;
        border-bottom: 1px solid rgba(255,255,255,0.05);
        display: flex;
        justify-content: space-between;
        align-items: center;
        cursor: pointer;
        transition: background 0.2s;
    }

    .game-item:hover {
        background: rgba(255,255,255,0.08);
    }

    .game-info {
        display: flex;
        flex-direction: column;
        gap: 2px;
    }

    .game-type { 
        color: #fff;
        font-weight: 700; 
        font-size: 0.95rem; 
        letter-spacing: -0.01em;
    }
    
    .room-code { 
        color: var(--accent);
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.7rem;
        font-weight: 600;
        letter-spacing: 0.05em;
    }

    .actions {
        display: flex;
        align-items: center;
        gap: 4px;
    }

    .join-icon-btn, .remove-btn {
        background: transparent;
        border: none;
        padding: 4px;
        color: rgba(255,255,255,0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 6px;
        transition: all 0.2s;
    }

    .game-item:hover .join-icon-btn {
        color: var(--accent);
        background: rgba(56, 178, 172, 0.1);
    }

    .remove-btn:hover {
        background: rgba(229, 62, 62, 0.15);
        color: var(--danger);
    }

    .empty-state {
        padding: 40px 20px;
        text-align: center;
        background: rgba(0,0,0,0.15);
    }

    .empty-state small {
        color: rgba(255,255,255,0.5);
        font-weight: 600;
        text-transform: uppercase;
        font-size: 0.7rem;
        letter-spacing: 0.05em;
    }
  `]
})
export class ActiveGamesComponent {
    activeRooms$: Observable<any[]>;
    count$: Observable<number>;
    isOpen = false;

    constructor(
        private readonly signalRService: SignalRService,
        private readonly router: Router,
        private readonly elementRef: ElementRef
    ) {
        this.activeRooms$ = this.signalRService.activeRooms$;
        this.count$ = new Observable(subscriber => {
            this.activeRooms$.subscribe(rooms => subscriber.next(rooms.length));
        });
    }

    @HostListener('document:click', ['$event'])
    onClickOutside(event: Event) {
        if (this.isOpen && !this.elementRef.nativeElement.contains(event.target)) {
            this.isOpen = false;
        }
    }

    toggle(event: Event) {
        event.stopPropagation();
        this.isOpen = !this.isOpen;
        if (this.isOpen) {
            this.signalRService.validateActiveRooms();
        }
    }

    joinRoom(code: string) {
        this.router.navigate(['/game', code]);
        this.isOpen = false;
    }

    removeRoom(code: string, event: Event) {
        event.stopPropagation();
        this.signalRService.removeActiveRoom(code);
    }
}
