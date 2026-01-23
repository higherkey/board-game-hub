import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { WebRTCService } from './webrtc.service';
import { SignalRService } from './signalr.service';
import { Subject } from 'rxjs';

const setRemoteDescriptionSpy = jasmine.createSpy('setRemoteDescription').and.returnValue(Promise.resolve());

// Mock RTCPeerConnection
class MockRTCPeerConnection {
    localDescription: any;
    remoteDescription: any;
    onicecandidate: any;
    ontrack: any;
    oniceconnectionstatechange: any;
    iceConnectionState: string = 'new';

    static get setRemoteDescriptionSpy() { return setRemoteDescriptionSpy; }

    addTrack = jasmine.createSpy('addTrack');
    createOffer = jasmine.createSpy('createOffer').and.returnValue(Promise.resolve({ type: 'offer', sdp: 'fake-offer' }));
    createAnswer = jasmine.createSpy('createAnswer').and.returnValue(Promise.resolve({ type: 'answer', sdp: 'fake-answer' }));
    setLocalDescription = jasmine.createSpy('setLocalDescription').and.returnValue(Promise.resolve());
    setRemoteDescription = setRemoteDescriptionSpy;
    addIceCandidate = jasmine.createSpy('addIceCandidate').and.returnValue(Promise.resolve());
    close = jasmine.createSpy('close');
}

describe('WebRTCService', () => {
    let service: WebRTCService;
    let mockSignalR: any;

    let offerSub = new Subject<any>();
    let answerSub = new Subject<any>();
    let candidateSub = new Subject<any>();

    beforeEach(() => {
        mockSignalR = {
            offerReceived$: offerSub.asObservable(),
            answerReceived$: answerSub.asObservable(),
            iceCandidateReceived$: candidateSub.asObservable(),
            sendOffer: jasmine.createSpy('sendOffer').and.returnValue(Promise.resolve()),
            sendAnswer: jasmine.createSpy('sendAnswer').and.returnValue(Promise.resolve()),
            sendIceCandidate: jasmine.createSpy('sendIceCandidate')
        };

        (globalThis as any).RTCPeerConnection = MockRTCPeerConnection;
        (globalThis as any).RTCSessionDescription = class { constructor(public init: any) { } };
        (globalThis as any).RTCIceCandidate = class { constructor(public init: any) { } };

        TestBed.configureTestingModule({
            providers: [
                WebRTCService,
                { provide: SignalRService, useValue: mockSignalR }
            ]
        });
        service = TestBed.inject(WebRTCService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should create PeerConnection when starting call', async () => {
        await service.startCall('peer1');
        expect(mockSignalR.sendOffer).toHaveBeenCalledWith('peer1', jasmine.stringMatching('fake-offer'));
    });

    it('should handle incoming offer', fakeAsync(() => {
        const fakeOffer = { senderId: 'sender1', sdp: JSON.stringify({ type: 'offer', sdp: 'remote-offer' }) };
        offerSub.next(fakeOffer);
        tick(100);
        expect(mockSignalR.sendAnswer).toHaveBeenCalledWith('sender1', jasmine.stringMatching('fake-answer'));
    }));

    it('should handle incoming answer', async () => {
        await service.startCall('peer1');
        const fakeAnswer = { senderId: 'peer1', sdp: JSON.stringify({ type: 'answer', sdp: 'remote-answer' }) };
        answerSub.next(fakeAnswer);
        await Promise.resolve();
        // Verify via static spy
        expect(MockRTCPeerConnection.setRemoteDescriptionSpy).toHaveBeenCalled();
    });
});
