import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-poppycock-rules',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './poppycock-rules.component.html',
  styleUrls: ['./poppycock-rules.component.scss']
})
export class PoppycockRulesComponent {
  @Output() closeRules = new EventEmitter<void>();
}
