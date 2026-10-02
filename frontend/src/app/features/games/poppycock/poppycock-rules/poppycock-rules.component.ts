import { Component, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-poppycock-rules',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './poppycock-rules.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./poppycock-rules.component.scss']
})
export class PoppycockRulesComponent {
  @Output() closeRules = new EventEmitter<void>();
}
