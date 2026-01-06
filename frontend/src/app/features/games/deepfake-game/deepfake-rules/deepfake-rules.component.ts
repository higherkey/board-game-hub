import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-deepfake-rules',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './deepfake-rules.component.html',
  styleUrls: ['./deepfake-rules.component.scss']
})
export class DeepfakeRulesComponent {
  @Output() rulesClose = new EventEmitter<void>();
}
