import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { RoundClock } from '../../../../shared/round-timing';

/** The one bar every game shows during play: menu, the game's status line, progress and the round clock. */
@Component({
    selector: 'app-game-bar',
    standalone: true,
    templateUrl: './game-bar.component.html',
    styleUrls: ['./game-bar.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class GameBarComponent {
    @Input() gameName = '';
    @Input() status = '';
    @Input() progress = '';
    @Input() clock: RoundClock | null = null;
    @Input() hasRules = false;
    @Output() menuOpen = new EventEmitter<void>();
    @Output() rulesOpen = new EventEmitter<void>();
}
