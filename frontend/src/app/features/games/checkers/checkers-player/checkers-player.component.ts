import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-checkers-player',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './checkers-player.component.html',
    styleUrls: ['./checkers-player.component.scss']
})
export class CheckersPlayerComponent {
    @Input() room: any;
    @Input() myConnectionId: string = '';
}
