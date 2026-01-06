import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VideoPopoutComponent } from './video-popout.component';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

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
        }).compileComponents();

        fixture = TestBed.createComponent(VideoPopoutComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
