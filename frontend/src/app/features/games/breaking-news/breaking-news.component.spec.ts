import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BreakingNewsComponent } from './breaking-news.component';
import { SignalRService } from '../../../services/signalr.service';
import { BehaviorSubject } from 'rxjs';

describe('BreakingNewsComponent', () => {
  let component: BreakingNewsComponent;
  let fixture: ComponentFixture<BreakingNewsComponent>;

  beforeEach(async () => {
    const mockSignalRService = {
      gameEvents$: new BehaviorSubject(null),
      submitBreakingNewsSlot: jasmine.createSpy('submitBreakingNewsSlot')
    };

    await TestBed.configureTestingModule({
      imports: [BreakingNewsComponent],
      providers: [
        { provide: SignalRService, useValue: mockSignalRService }
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(BreakingNewsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
