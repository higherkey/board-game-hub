import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-checkers-board',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './checkers-board.component.html',
    styleUrls: ['./checkers-board.component.scss']
})
export class CheckersBoardComponent {
    @Input() room: any;
}
