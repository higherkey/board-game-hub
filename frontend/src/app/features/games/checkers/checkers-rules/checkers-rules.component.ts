import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-checkers-rules',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './checkers-rules.component.html',
    styleUrls: ['./checkers-rules.component.scss']
})
export class CheckersRulesComponent {
    @Output() closeRules = new EventEmitter<void>();
}
