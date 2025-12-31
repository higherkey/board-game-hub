import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-great-minds-rules',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './great-minds-rules.component.html',
  styleUrls: ['./great-minds-rules.component.scss']
})
export class GreatMindsRulesComponent {
  @Output() closeRules = new EventEmitter<void>();
}
