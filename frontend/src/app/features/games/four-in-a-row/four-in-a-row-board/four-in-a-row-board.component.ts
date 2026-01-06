import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-four-in-a-row-board',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './four-in-a-row-board.component.html',
    styleUrls: ['./four-in-a-row-board.component.scss']
})
export class FourInARowBoardComponent {
    @Input() room: any;
}
