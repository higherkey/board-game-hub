import { Component, EventEmitter, Input, Output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-end-round-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './end-round-button.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./end-round-button.component.scss']
})
export class EndRoundButtonComponent {
  @Input() disabled = false;
  @Input() label = 'END ROUND';
  @Output() endRound = new EventEmitter<void>();

  handleClick() {
    this.endRound.emit();
  }
}
