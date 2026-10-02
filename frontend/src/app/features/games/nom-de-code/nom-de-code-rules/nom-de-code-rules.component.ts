import { Component, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-nom-de-code-rules',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './nom-de-code-rules.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./nom-de-code-rules.component.scss']
})
export class NomDeCodeRulesComponent {
    @Output() closeRules = new EventEmitter<void>();
}
