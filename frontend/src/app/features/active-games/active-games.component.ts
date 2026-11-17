import { Component, HostListener, ElementRef, OnInit, inject, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { SignalRService } from '../../services/signalr.service';
import { Router, NavigationEnd } from '@angular/router';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';

@Component({
    selector: 'app-active-games',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './active-games.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./active-games.component.scss']
})
export class ActiveGamesComponent implements OnInit {
    private readonly destroyRef = inject(DestroyRef);
    activeRooms$: Observable<any[]>;
    count$: Observable<number>;
    isOpen = false;

    constructor(
        private readonly signalRService: SignalRService,
        private readonly router: Router,
        private readonly elementRef: ElementRef
    ) {
        this.activeRooms$ = this.signalRService.activeRooms$;
        this.count$ = this.activeRooms$.pipe(map(rooms => rooms.length));

        // specific trigger for navigation updates
        this.router.events.pipe(
            filter(event => event instanceof NavigationEnd),
            takeUntilDestroyed(this.destroyRef)
        ).subscribe(() => {
            void this.signalRService.validateActiveRooms();
        });
    }

    ngOnInit() {
        void this.signalRService.validateActiveRooms();
    }

    @HostListener('document:click', ['$event'])
    onClickOutside(event: Event) {
        if (this.isOpen && !this.elementRef.nativeElement.contains(event.target)) {
            this.isOpen = false;
        }
    }

    @HostListener('document:keydown.escape')
    onEscape() {
        if (this.isOpen) {
            this.isOpen = false;
        }
    }

    toggle(event: Event) {
        event.stopPropagation();
        this.isOpen = !this.isOpen;
        if (this.isOpen) {
            void this.signalRService.validateActiveRooms();
        }
    }

    joinRoom(code: string) {
        void this.router.navigate(['/game', code]);
        this.isOpen = false;
    }

    removeRoom(code: string, event: Event) {
        event.stopPropagation();
        this.signalRService.removeActiveRoom(code);
    }
}
