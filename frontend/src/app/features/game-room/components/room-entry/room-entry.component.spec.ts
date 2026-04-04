import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RoomEntryComponent } from './room-entry.component';
import { ToastService } from '../../../../shared/services/toast.service';

describe('RoomEntryComponent', () => {
  let component: RoomEntryComponent;
  let fixture: ComponentFixture<RoomEntryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RoomEntryComponent],
      providers: [
        provideRouter([]),
        { provide: ToastService, useValue: { showError: jasmine.createSpy('showError') } }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RoomEntryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not emit submitEntry when name is empty', () => {
    const spy = jasmine.createSpy('submitEntry');
    component.submitEntry.subscribe(spy);
    component.onSubmit();
    expect(spy).not.toHaveBeenCalled();
  });

  it('should not emit submitEntry when joinType is not selected', () => {
    const spy = jasmine.createSpy('submitEntry');
    component.submitEntry.subscribe(spy);
    component.promptPlayerName = 'TestUser';
    component.joinType = null;
    component.onSubmit();
    expect(spy).not.toHaveBeenCalled();
  });

  it('should emit submitEntry with valid data', () => {
    const emitted: any[] = [];
    component.submitEntry.subscribe((v) => emitted.push(v));
    component.promptPlayerName = 'TestUser';
    component.joinType = 'player';
    component.isPublic = false;
    component.onSubmit();
    expect(emitted.length).toBe(1);
    expect(emitted[0].name).toBe('TestUser');
    expect(emitted[0].joinType).toBe('player');
    expect(emitted[0].isPublic).toBeFalse();
  });
});
