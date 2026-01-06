import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-warships-rules',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './warships-rules.component.html',
    styleUrls: ['./warships-rules.component.scss']
})
export class WarshipsRulesComponent {
    @Output() closeRules = new EventEmitter<void>();
}
