import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-four-in-a-row-rules',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './four-in-a-row-rules.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./four-in-a-row-rules.component.scss']
})
/** The rules, shown in the room's rules drawer. */
export class FourInARowRulesComponent {}
