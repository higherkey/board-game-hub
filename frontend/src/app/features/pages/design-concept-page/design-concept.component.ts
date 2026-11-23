import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { HomeHeroComponent } from '../../../components/home-hero/home-hero.component';

@Component({
  selector: 'app-design-concept',
  standalone: true,
  imports: [RouterModule, HomeHeroComponent],
  templateUrl: './design-concept.component.html',
  styleUrl: './design-concept.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DesignConceptComponent {}
