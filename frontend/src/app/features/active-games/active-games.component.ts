import { Component, HostListener, ElementRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SignalRService } from '../../services/signalr.service';
import { Router, NavigationEnd } from '@angular/router';
import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';

@Component({
    selector: 'app-active-games',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './active-games.component.html',
    styleUrls: ['./active-games.component.scss']
})
export class ActiveGamesComponent implements OnInit {
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

        // specific trigger for navigation updates
        this.router.events.pipe(
            filter(event => event instanceof NavigationEnd)
        ).subscribe(() => {
            this.signalRService.validateActiveRooms();
        });
    }

    ngOnInit() {
        this.signalRService.validateActiveRooms();
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
