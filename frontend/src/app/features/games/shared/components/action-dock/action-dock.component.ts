import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Optional bottom bar for a Hand's main actions, in thumb reach. A game uses it only where that suits the game. */
@Component({
    selector: 'app-action-dock',
    standalone: true,
    template: '<ng-content></ng-content>',
    styleUrls: ['./action-dock.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ActionDockComponent {}
