import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VideoPopoutComponent } from './video-popout.component';
import { ActivatedRoute } from '@angular/router';
import { Component } from '@angular/core';
import { VideoChatComponent } from '../video-chat.component';
import { of } from 'rxjs';

@Component({ selector: 'app-video-chat', template: '', standalone: true, imports: [] })
class VideoChatStubComponent { }

describe('VideoPopoutComponent', () => {
    let component: VideoPopoutComponent;
    let fixture: ComponentFixture<VideoPopoutComponent>;
    let mockActivatedRoute: any;

    beforeEach(async () => {
        mockActivatedRoute = {
            params: of({ code: 'ABCD' })
        };

        await TestBed.configureTestingModule({
            imports: [VideoPopoutComponent],
            providers: [
                { provide: ActivatedRoute, useValue: mockActivatedRoute }
            ]
        })
            .overrideComponent(VideoPopoutComponent, {
                remove: { imports: [VideoChatComponent] },
                add: { imports: [VideoChatStubComponent] }
            })
            .compileComponents();

        fixture = TestBed.createComponent(VideoPopoutComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
