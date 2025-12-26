import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { SocialPanelComponent } from '../../shared/components/social-panel/social-panel.component';

@Component({
  selector: 'app-social',
  standalone: true,
  imports: [CommonModule, PageHeaderComponent, SocialPanelComponent],
  template: `
    <div class="social-page">
        <app-page-header 
            title="Social Hub" 
            subtitle="Connect with friends, chat, and track your stats.">
        </app-page-header>
        
        <app-social-panel></app-social-panel>
    </div>
  `
})
export class SocialComponent { }
