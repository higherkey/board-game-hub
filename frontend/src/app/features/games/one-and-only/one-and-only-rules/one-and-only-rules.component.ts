import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-one-and-only-rules',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './one-and-only-rules.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./one-and-only-rules.component.scss']
})
export class OneAndOnlyRulesComponent { }
