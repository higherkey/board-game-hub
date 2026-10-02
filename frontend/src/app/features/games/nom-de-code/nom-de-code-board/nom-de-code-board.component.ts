import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-nom-de-code-board',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './nom-de-code-board.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./nom-de-code-board.component.scss']
})
export class NomDeCodeBoardComponent {
    @Input() room: any;
}
