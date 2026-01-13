import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VideoChatComponent } from './video-chat.component';
import { WebRTCService } from '../../../../services/webrtc.service';
import { SignalRService } from '../../../../services/signalr.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import { CommonModule } from '@angular/common';

describe('VideoChatComponent', () => {
    let component: VideoChatComponent;
    let fixture: ComponentFixture<VideoChatComponent>;
    let mockWebRTCService: any;
    let mockSignalRService: any;
    let mockToastService: any;

    let playersSubject = new BehaviorSubject<any[]>([]);
    let remoteStreamsSubject = new BehaviorSubject<any[]>([]);

    beforeEach(async () => {
        mockWebRTCService = {
            initLocalStream: jasmine.createSpy('initLocalStream').and.returnValue(Promise.resolve({
                getTracks: () => [],
                getAudioTracks: () => [{ enabled: true }],
                getVideoTracks: () => [{ enabled: true }]
            })),
            stopLocalStream: jasmine.createSpy('stopLocalStream'),
            startCall: jasmine.createSpy('startCall'),
            remoteStreams$: remoteStreamsSubject.asObservable()
        };

        mockSignalRService = {
            getConnectionId: () => 'me',
            players$: playersSubject
        };

        mockToastService = {
            showError: jasmine.createSpy('showError')
        };

        await TestBed.configureTestingModule({
            imports: [VideoChatComponent, CommonModule], // Standalone
            providers: [
                { provide: WebRTCService, useValue: mockWebRTCService },
                { provide: SignalRService, useValue: mockSignalRService },
                { provide: ToastService, useValue: mockToastService },
                { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => 'CODE' } } } }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(VideoChatComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should join video calls initLocalStream', async () => {
        await component.joinVideo();
        expect(mockWebRTCService.initLocalStream).toHaveBeenCalled();
        expect(component.isVideoActive).toBeTrue();
    });

    it('should toggle audio', async () => {
        await component.joinVideo();
        component.toggleAudio();
        expect(component.isAudioMuted).toBeTrue();
    });

    it('should leave video stops stream', () => {
        component.isVideoActive = true;
        component.leaveVideo();
        expect(mockWebRTCService.stopLocalStream).toHaveBeenCalled();
        expect(component.isVideoActive).toBeFalse();
    });
});
