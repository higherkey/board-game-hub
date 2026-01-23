import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { SignalRService } from './signalr.service';

export interface RemoteStream {
    peerId: string;
    stream: MediaStream;
}

@Injectable({
    providedIn: 'root'
})
export class WebRTCService {
    private readonly peerConnections: Map<string, RTCPeerConnection> = new Map();
    private localStream: MediaStream | null = null;
    public remoteStreams$ = new BehaviorSubject<RemoteStream[]>([]);

    private readonly rtcConfig: RTCConfiguration = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' }, // Google's public STUN
            { urls: 'stun:stun1.l.google.com:19302' }
        ]
    };

    constructor(private readonly signalRService: SignalRService) {
        this.initialiseSignalRListeners();
    }

    private initialiseSignalRListeners() {
        this.signalRService.offerReceived$.subscribe(async (data) => {
            if (data) {
                await this.handleOffer(data.senderId, data.sdp);
            }
        });

        this.signalRService.answerReceived$.subscribe(async (data) => {
            if (data) {
                await this.handleAnswer(data.senderId, data.sdp);
            }
        });

        this.signalRService.iceCandidateReceived$.subscribe(async (data) => {
            if (data) {
                await this.handleIceCandidate(data.senderId, data.candidate);
            }
        });
    }

    public async initLocalStream(): Promise<MediaStream> {
        try {
            this.localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            return this.localStream;
        } catch (error) {
            console.error('Error accessing media devices:', error);
            throw error;
        }
    }

    public stopLocalStream() {
        this.localStream?.getTracks().forEach(track => track.stop());
        this.localStream = null;
        this.closeAllConnections();
    }

    public async startCall(targetPeerId: string) {
        const pc = this.createPeerConnection(targetPeerId);

        // Add local tracks
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => pc.addTrack(track, this.localStream!));
        }

        // Create Offer
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        // Send Offer via SignalR
        await this.signalRService.sendOffer(targetPeerId, JSON.stringify(offer));
    }

    private async handleOffer(senderId: string, sdpString: string) {
        const pc = this.createPeerConnection(senderId);

        // Add local tracks to answer
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => pc.addTrack(track, this.localStream!));
        }

        const offer = JSON.parse(sdpString);
        await pc.setRemoteDescription(new RTCSessionDescription(offer));

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        // Send Answer via SignalR
        await this.signalRService.sendAnswer(senderId, JSON.stringify(answer));
    }

    private async handleAnswer(senderId: string, sdpString: string) {
        const pc = this.peerConnections.get(senderId);
        if (pc) {
            const answer = JSON.parse(sdpString);
            await pc.setRemoteDescription(new RTCSessionDescription(answer));
        }
    }

    private async handleIceCandidate(senderId: string, candidateString: string) {
        const pc = this.peerConnections.get(senderId);
        if (pc) {
            const candidate = JSON.parse(candidateString);
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
    }

    private createPeerConnection(peerId: string): RTCPeerConnection {
        if (this.peerConnections.has(peerId)) {
            return this.peerConnections.get(peerId)!;
        }

        const pc = new RTCPeerConnection(this.rtcConfig);

        // ICE Candidates
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                this.signalRService.sendIceCandidate(peerId, JSON.stringify(event.candidate));
            }
        };

        // Track received
        pc.ontrack = (event) => {
            console.info(`Received track from ${peerId}`, event.streams[0]);

            const currentStreams = this.remoteStreams$.value;

            // Check if we already have this stream
            const existing = currentStreams.find(s => s.peerId === peerId);
            if (!existing && event.streams[0]) {
                const newStream: RemoteStream = { peerId, stream: event.streams[0] };
                this.remoteStreams$.next([...currentStreams, newStream]);
            }
        };

        // Cleanup on disconnect
        pc.oniceconnectionstatechange = () => {
            if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'closed') {
                this.removePeer(peerId);
            }
        };

        this.peerConnections.set(peerId, pc);
        return pc;
    }

    private removePeer(peerId: string) {
        const pc = this.peerConnections.get(peerId);
        if (pc) {
            pc.close();
            this.peerConnections.delete(peerId);
        }
        // Update observables
        const streams = this.remoteStreams$.value.filter(s => s.peerId !== peerId);
        this.remoteStreams$.next(streams);
    }

    private closeAllConnections() {
        this.peerConnections.forEach(pc => pc.close());
        this.peerConnections.clear();
        this.remoteStreams$.next([]);
    }
}
