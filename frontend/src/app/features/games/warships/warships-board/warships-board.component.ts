import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-warships-board',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './warships-board.component.html',
    styleUrls: ['./warships-board.component.scss']
})
export class WarshipsBoardComponent {
    @Input() room: any;
}
