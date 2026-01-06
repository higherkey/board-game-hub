import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-nom-de-code-player',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './nom-de-code-player.component.html',
    styleUrls: ['./nom-de-code-player.component.scss']
})
export class NomDeCodePlayerComponent {
    @Input() room: any;
    @Input() myConnectionId: string = '';
}
