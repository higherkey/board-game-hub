import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-nom-de-code-board',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './nom-de-code-board.component.html',
    styleUrls: ['./nom-de-code-board.component.scss']
})
export class NomDeCodeBoardComponent {
    @Input() room: any;
}
