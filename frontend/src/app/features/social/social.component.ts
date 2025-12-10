import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SocialPanelComponent } from '../../shared/components/social-panel/social-panel.component';

@Component({
  selector: 'app-social',
  standalone: true,
  imports: [CommonModule, SocialPanelComponent],
  template: `
    <div class="social-page">
        <div class="text-center py-4 mb-4">
            <h1 class="display-5 text-primary fw-bold">Social Hub</h1>
            <p class="lead text-secondary">Connect with friends, chat, and track your stats.</p>
        </div>
        
        <app-social-panel></app-social-panel>
    </div>
  `
})
export class SocialComponent { }
