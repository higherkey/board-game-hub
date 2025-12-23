import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { VideoChatComponent } from '../game-room/components/video-chat/video-chat.component';

@Component({
    selector: 'app-video-popout',
    standalone: true,
    imports: [CommonModule, VideoChatComponent],
    template: `
    <div class="popout-container">
      <app-video-chat></app-video-chat>
    </div>
  `,
    styles: [`
    .popout-container {
      height: 100vh;
      background: #121212;
      display: flex;
      flex-direction: column;
    }
    :host ::ng-deep .video-chat-container {
      height: 100%;
      background: transparent;
    }
  `]
})
export class VideoPopoutComponent implements OnInit {
    constructor(private readonly route: ActivatedRoute) { }

    ngOnInit() {
        // The VideoChatComponent handles its own connection and room logic usually.
        // If it needs the room code, it should get it from the route.
    }
}
