import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sushi-train-rules',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sushi-train-rules.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./sushi-train-rules.component.scss']
})
export class SushiTrainRulesComponent { }
