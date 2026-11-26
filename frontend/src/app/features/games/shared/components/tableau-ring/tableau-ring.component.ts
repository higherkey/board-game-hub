import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { TableauEntry } from '../../../../game-room/services/game-chrome.service';

/** Every player's score at a glance, the active player marked. */
@Component({
    selector: 'app-tableau-ring',
    standalone: true,
    templateUrl: './tableau-ring.component.html',
    styleUrls: ['./tableau-ring.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TableauRingComponent {
    @Input() entries: TableauEntry[] = [];
    @Input() label = 'Scores';
}
