import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-about',
    standalone: true,
    imports: [RouterModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './about.component.html',
    styleUrls: ['./about.component.scss']
})
export class AboutComponent { }
