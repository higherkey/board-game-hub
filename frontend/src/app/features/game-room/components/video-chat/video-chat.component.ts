import { Component, OnInit, OnDestroy, ViewChild, ElementRef, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { WebRTCService, RemoteStream } from '../../../../services/webrtc.service';
import { SignalRService, Player } from '../../../../services/signalr.service';
import { Subscription } from 'rxjs';
import { ToastService } from '../../../../shared/services/toast.service';

export type VideoViewMode = 'sidebar' | 'overlay' | 'docked-top' | 'docked-bottom';

@Component({
  selector: 'app-video-chat',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './video-chat.component.html',
  styleUrl: './video-chat.component.scss'
})
export class VideoChatComponent implements OnInit, OnDestroy {
  @ViewChild('localVideo') localVideoRef!: ElementRef<HTMLVideoElement>;
  @Output() viewModeChange = new EventEmitter<VideoViewMode>();

  public remoteStreams: RemoteStream[] = [];
  public players: Player[] = [];
  public playerStreams: Map<string, MediaStream | null> = new Map(); // connectionId -> Stream

  private readonly subscriptions: Subscription = new Subscription();
  public isAudioMuted = false;
  public isVideoMuted = false;
  public isVideoActive = false;
  public localStream: MediaStream | null = null;
  public localConnectionId: string = '';

  // New View Settings
  public viewMode: VideoViewMode = 'sidebar';
  public overlayPosition: 'top-right' | 'bottom-right' | 'bottom-left' | 'top-left' = 'bottom-right';
  public overlaySize: 'small' | 'medium' | 'large' = 'medium';
  public showSettings = false;

  constructor(
    private readonly webrtcService: WebRTCService,
    private readonly signalRService: SignalRService,
    private readonly toastService: ToastService,
    private readonly route: ActivatedRoute
  ) { }

  ngOnInit() {
    this.localConnectionId = this.signalRService.getConnectionId() || '';

    // Subscribe to Players
    this.subscriptions.add(
      this.signalRService.players$.subscribe(players => {
        this.players = players;
        this.mapStreamsToPlayers();
      })
    );

    // Subscribe to remote streams
    this.subscriptions.add(
      this.webrtcService.remoteStreams$.subscribe((streams: RemoteStream[]) => {
        this.remoteStreams = streams;
        this.mapStreamsToPlayers();
      })
    );
  }

  private mapStreamsToPlayers() {
    this.playerStreams.clear();

    // Map remote streams
    this.remoteStreams.forEach(rs => {
      this.playerStreams.set(rs.peerId, rs.stream);
    });

    // Map local stream (need to find my connection ID)
    if (this.localStream && this.localConnectionId) {
      this.playerStreams.set(this.localConnectionId, this.localStream);
    }
  }

  getStreamForPlayer(connectionId: string): MediaStream | null | undefined {
    return this.playerStreams.get(connectionId);
  }

  async joinVideo() {
    try {
      this.localStream = await this.webrtcService.initLocalStream();
      this.isVideoActive = true;

      this.localConnectionId = this.signalRService.getConnectionId() || '';
      this.mapStreamsToPlayers();

      // Set local video element after view updates
      this.updateLocalVideo();

      // Start calls to other players in the room
      this.startCallsToOtherPlayers();
    } catch (error) {
      console.error('Failed to start video:', error);
      this.toastService.showError('Could not access camera/microphone. Please check permissions.');
    }
  }

  private updateLocalVideo() {
    setTimeout(() => {
      if (this.localVideoRef?.nativeElement && this.localStream) {
        this.localVideoRef.nativeElement.srcObject = this.localStream;
      }
    }, 0);
  }

  private startCallsToOtherPlayers() {
    const players = this.signalRService.players$.value;
    players.forEach((p: Player) => {
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

  // --- New Feature Methods ---

  setViewMode(mode: VideoViewMode) {
    this.viewMode = mode;
    this.viewModeChange.emit(mode);
  }

  setOverlayPosition(pos: any) {
    this.overlayPosition = pos;
  }

  setOverlaySize(size: any) {
    this.overlaySize = size;
  }

  toggleSettings() {
    this.showSettings = !this.showSettings;
  }

  async requestPiP(videoElement: HTMLVideoElement) {
    try {
      if (videoElement !== document.pictureInPictureElement) {
        await videoElement.requestPictureInPicture();
      } else {
        await document.exitPictureInPicture();
      }
    } catch (error) {
      console.error('PiP failed', error);
      this.toastService.showError('Picture-in-Picture is not supported or failed.');
    }
  }

  openPopout() {
    const roomCode = this.route.snapshot.paramMap.get('code') || this.route.snapshot.queryParamMap.get('code');
    if (roomCode) {
      const url = `/video-popout/${roomCode}`;
      window.open(url, 'VideoChatPopout', 'width=400,height=600,menubar=no,toolbar=no,location=no,status=no');
      this.leaveVideo(); // Stop local video in main window if popping out? 
      // Or maybe keep both? UI might get confusing. Popout usually implies moving it.
    }
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
    if (this.isVideoActive) {
      this.webrtcService.stopLocalStream();
    }
  }
}
