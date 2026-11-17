import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-warships-player',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './warships-player.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./warships-player.component.scss']
})
export class WarshipsPlayerComponent {
    @Input() room: any;
    @Input() myConnectionId: string = '';
}
