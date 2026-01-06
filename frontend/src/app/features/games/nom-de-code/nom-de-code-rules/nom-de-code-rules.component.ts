import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-nom-de-code-rules',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './nom-de-code-rules.component.html',
    styleUrls: ['./nom-de-code-rules.component.scss']
})
export class NomDeCodeRulesComponent {
    @Output() closeRules = new EventEmitter<void>();
}
