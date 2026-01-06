import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-four-in-a-row-player',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './four-in-a-row-player.component.html',
    styleUrls: ['./four-in-a-row-player.component.scss']
})
export class FourInARowPlayerComponent {
    @Input() room: any;
    @Input() myConnectionId: string = '';
}
