import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WebRTCService, RemoteStream } from '../../../../services/webrtc.service';
import { SignalRService, Player } from '../../../../services/signalr.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-video-chat',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './video-chat.component.html',
  styleUrl: './video-chat.component.scss'
})
export class VideoChatComponent implements OnInit, OnDestroy {
  @ViewChild('localVideo') localVideoRef!: ElementRef<HTMLVideoElement>;

  public remoteStreams: RemoteStream[] = [];
  private readonly subscriptions: Subscription = new Subscription();
  public isAudioMuted = false;
  public isVideoMuted = false;
  public isVideoActive = false;
  private localStream: MediaStream | null = null;

  constructor(
    private readonly webrtcService: WebRTCService,
    private readonly signalRService: SignalRService
  ) { }

  ngOnInit() {
    // Subscribe to remote streams (will only show when video is active)
    this.subscriptions.add(
      this.webrtcService.remoteStreams$.subscribe((streams: RemoteStream[]) => {
        this.remoteStreams = streams;
      })
    );
  }

  async joinVideo() {
    try {
      this.localStream = await this.webrtcService.initLocalStream();
      this.isVideoActive = true;

      // Set local video element after view updates
      setTimeout(() => {
        if (this.localVideoRef?.nativeElement && this.localStream) {
          this.localVideoRef.nativeElement.srcObject = this.localStream;
        }
      }, 0);

      // Start calls to other players in the room
      this.startCallsToOtherPlayers();
    } catch (error) {
      console.error('Failed to start video:', error);
      alert('Could not access camera/microphone. Please check permissions.');
    }
  }

  private startCallsToOtherPlayers() {
    const players = this.signalRService.players$.value;
    players.forEach((p: Player) => {
      // Don't call ourselves - we check by comparing connection IDs
      // The WebRTCService.startCall already checks for existing connections
      this.webrtcService.startCall(p.connectionId);
    });
  }

  leaveVideo() {
    this.webrtcService.stopLocalStream();
    this.localStream = null;
    this.isVideoActive = false;
    this.remoteStreams = [];
  }

  toggleAudio() {
    this.isAudioMuted = !this.isAudioMuted;
    this.localStream?.getAudioTracks().forEach(t => t.enabled = !this.isAudioMuted);
  }

  toggleVideo() {
    this.isVideoMuted = !this.isVideoMuted;
    this.localStream?.getVideoTracks().forEach(t => t.enabled = !this.isVideoMuted);
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
    if (this.isVideoActive) {
      this.webrtcService.stopLocalStream();
    }
  }
}
