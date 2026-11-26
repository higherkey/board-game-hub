import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, Output, ViewChild, signal } from '@angular/core';
import { TableauEntry } from '../../services/game-chrome.service';
import { TableauRingComponent } from '../../../games/shared/components/tableau-ring/tableau-ring.component';

/**
 * The one in-game menu, the same for every game: this game, the room, host controls, leave.
 * One flat list under plain headings, never nested, so anything is two taps from play.
 */
@Component({
    selector: 'app-game-menu',
    standalone: true,
    imports: [TableauRingComponent],
    templateUrl: './game-menu.component.html',
    styleUrls: ['./game-menu.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class GameMenuComponent {
    @Input() roomCode = '';
    @Input() isHost = false;
    @Input() canUndo = false;
    @Input() isMuted = false;
    @Input() videoReady = false;
    @Input() hasRules = true;
    @Input() scores: TableauEntry[] | null = null;
    @Output() rules = new EventEmitter<void>();
    @Output() players = new EventEmitter<void>();
    @Output() toggleSound = new EventEmitter<void>();
    @Output() startVideo = new EventEmitter<void>();
    @Output() undo = new EventEmitter<void>();
    @Output() leave = new EventEmitter<void>();

    @ViewChild('dialog', { static: true }) private readonly dialog!: ElementRef<HTMLDialogElement>;
    protected readonly copied = signal(false);

    open(): void {
        if (!this.dialog.nativeElement.open) this.dialog.nativeElement.showModal();
    }

    /** Closing a modal dialog hands focus back to whatever opened it. */
    close(): void {
        if (this.dialog.nativeElement.open) this.dialog.nativeElement.close();
    }

    /** Close first, so whatever the item opens next (rules, players, a confirm) is not under the menu. */
    protected pick(output: EventEmitter<void>): void {
        this.close();
        output.emit();
    }

    protected async copyInvite(): Promise<void> {
        try {
            await navigator.clipboard.writeText(`${location.origin}/game/${this.roomCode}`);
            this.copied.set(true);
            setTimeout(() => this.copied.set(false), 2000);
        } catch {
            // Clipboard blocked: the room code stays on screen to read out.
        }
    }

    protected backdrop(event: MouseEvent): void {
        if (event.target === this.dialog.nativeElement) this.close();
    }
}
