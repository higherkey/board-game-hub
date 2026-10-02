import { Component, EventEmitter, Output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-wisecrack-rules',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './wisecrack-rules.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./wisecrack-rules.component.scss']
})
export class WisecrackRulesComponent {
  @Output() dismiss = new EventEmitter<void>();
}
