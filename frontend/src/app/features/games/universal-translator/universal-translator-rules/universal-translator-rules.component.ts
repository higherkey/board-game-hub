import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-universal-translator-rules',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './universal-translator-rules.component.html',
  styleUrls: ['./universal-translator-rules.component.scss']
})
export class UniversalTranslatorRulesComponent {
  /** Emitted when the user closes the rules overlay */
  @Output() dismiss = new EventEmitter<void>();
}
