import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { VideoChatComponent } from '../game-room/components/video-chat/video-chat.component';

@Component({
  selector: 'app-video-popout',
  standalone: true,
  imports: [CommonModule, VideoChatComponent],
  templateUrl: './video-popout.component.html',
  styleUrls: ['./video-popout.component.scss']
})
export class VideoPopoutComponent implements OnInit {
  constructor(private readonly route: ActivatedRoute) { }

  ngOnInit() {
    // The VideoChatComponent handles its own connection and room logic usually.
    // If it needs the room code, it should get it from the route.
  }
}
