import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-four-in-a-row-rules',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './four-in-a-row-rules.component.html',
    styleUrls: ['./four-in-a-row-rules.component.scss']
})
export class FourInARowRulesComponent {
    @Output() closeRules = new EventEmitter<void>();
}
