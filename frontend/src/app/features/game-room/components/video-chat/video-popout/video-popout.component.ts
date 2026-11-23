import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { VideoChatComponent } from '../video-chat.component';

@Component({
  selector: 'app-video-popout',
  standalone: true,
  imports: [CommonModule, VideoChatComponent],
  templateUrl: './video-popout.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./video-popout.component.scss']
})
export class VideoPopoutComponent {
  constructor(private readonly route: ActivatedRoute) { }

}
