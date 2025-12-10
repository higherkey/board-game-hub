import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-logo',
  standalone: true,
  imports: [CommonModule],
  template: `
    <svg [class]="className" [attr.width]="size" [attr.height]="size" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <!-- Base -->
      <path d="M50 85C70 85 85 90 85 95H15C15 90 30 85 50 85Z" fill="currentColor"/>
      
      <!-- Body (Cone) -->
      <path d="M50 25L80 85H20L50 25Z" fill="currentColor" fill-opacity="0.8"/>
      
      <!-- Neck Ring -->
      <path d="M38 28H62L65 32H35L38 28Z" fill="var(--accent)"/>
      
      <!-- Head (Sphere) -->
      <circle cx="50" cy="20" r="15" fill="currentColor"/>
    </svg>
  `
})
export class LogoComponent {
  @Input() size = 40;
  @Input() className = '';
}
