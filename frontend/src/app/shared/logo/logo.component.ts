import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-logo',
  standalone: true,
  imports: [CommonModule],
  template: `
    <img src="assets/logo.png" 
         alt="BoardGameHub Logo" 
         [class]="className"
         [style.width.px]="size" 
         [style.height.px]="size"
         style="object-fit: contain;">
  `
})
export class LogoComponent {
  @Input() size = 40;
  @Input() className = '';
}
