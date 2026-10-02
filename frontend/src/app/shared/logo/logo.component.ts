import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-logo',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './logo.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./logo.component.scss']
})
export class LogoComponent {
  @Input() size = 40;
  @Input() className = '';
}
