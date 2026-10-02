import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

@Component({
    selector: 'app-about',
    standalone: true,
    imports: [CommonModule, RouterModule, PageHeaderComponent],
    changeDetection: ChangeDetectionStrategy.Eager,
    templateUrl: './about.component.html'
})
export class AboutComponent { }
