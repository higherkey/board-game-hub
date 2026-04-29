import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RoomEntryComponent } from './room-entry.component';
import { ToastService } from '../../../../shared/services/toast.service';
import { FormsModule } from '@angular/forms';

describe('RoomEntryComponent', () => {
  let component: RoomEntryComponent;
  let fixture: ComponentFixture<RoomEntryComponent>;
  let toastServiceSpy: jasmine.SpyObj<ToastService>;

  beforeEach(async () => {
    toastServiceSpy = jasmine.createSpyObj('ToastService', ['showError']);

    await TestBed.configureTestingModule({
      imports: [RoomEntryComponent, FormsModule],
      providers: [
        provideRouter([]),
        { provide: ToastService, useValue: toastServiceSpy }
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

  it('should not emit submitEntry when name is empty and show error', fakeAsync(() => {
    const spy = jasmine.createSpy('submitEntry');
    const focusSpy = spyOn(component.playerNameInput.nativeElement, 'focus');
    
    component.submitEntry.subscribe(spy);
    component.promptPlayerName = '';
    
    component.onSubmit();
    
    expect(spy).not.toHaveBeenCalled();
    expect(toastServiceSpy.showError).toHaveBeenCalledWith('Please enter a display name to continue.');
    expect(component.showNameError).toBeTrue();
    
    tick(); // for setTimeout
    expect(focusSpy).toHaveBeenCalled();
  }));

  it('should not emit submitEntry when joinType is not selected', () => {
    const spy = jasmine.createSpy('submitEntry');
    component.submitEntry.subscribe(spy);
    component.promptPlayerName = 'TestUser';
    component.joinType = null;
    
    component.onSubmit();
    
    expect(spy).not.toHaveBeenCalled();
    expect(toastServiceSpy.showError).toHaveBeenCalledWith('Please select whether you are joining as a Player or a Table.');
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

  it('should emit login when goToLogin is called', () => {
    const spy = jasmine.createSpy('login');
    component.login.subscribe(spy);
    component.goToLogin();
    expect(spy).toHaveBeenCalled();
  });
});
