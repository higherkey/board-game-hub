import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { SocialPanelComponent } from '../../shared/components/social-panel/social-panel.component';

@Component({
  selector: 'app-social',
  standalone: true,
  imports: [CommonModule, PageHeaderComponent, SocialPanelComponent],
  templateUrl: './social.component.html',
  styleUrls: ['./social.component.scss']
})
export class SocialComponent { }
