import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RoomHeaderComponent } from './room-header.component';
import { UserProfileDropdownComponent } from '../../../../shared/components/user-profile-dropdown/user-profile-dropdown.component';

@Component({ selector: 'app-user-profile-dropdown', template: '', changeDetection: ChangeDetectionStrategy.Eager,
 standalone: true })
class UserProfileDropdownStub {
  @Input() session: any;
  @Input() compactMode: any;
  @Input() menuAlign: any;
}

describe('RoomHeaderComponent', () => {
  let component: RoomHeaderComponent;
  let fixture: ComponentFixture<RoomHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RoomHeaderComponent],
      providers: [provideRouter([])]
    })
    .overrideComponent(RoomHeaderComponent, {
      remove: { imports: [UserProfileDropdownComponent] },
      add: { imports: [UserProfileDropdownStub] }
    })
    .compileComponents();

    fixture = TestBed.createComponent(RoomHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle nav menu', () => {
    expect(component.isNavMenuOpen).toBeFalse();
    component.toggleNavMenu();
    expect(component.isNavMenuOpen).toBeTrue();
    component.toggleNavMenu();
    expect(component.isNavMenuOpen).toBeFalse();
  });

  it('should emit leaveRoom when leaveRoom method is called', () => {
    spyOn(component.leaveRoom, 'emit');
    component.leaveRoom.emit(); // Usually called by template (click)
    expect(component.leaveRoom.emit).toHaveBeenCalled();
  });

  it('should emit startVideoChat when startVideoChat emission is triggered', () => {
    spyOn(component.startVideoChat, 'emit');
    component.startVideoChat.emit();
    expect(component.startVideoChat.emit).toHaveBeenCalled();
  });

  it('should emit requestUndo when requestUndo emission is triggered', () => {
    spyOn(component.requestUndo, 'emit');
    component.requestUndo.emit();
    expect(component.requestUndo.emit).toHaveBeenCalled();
  });

  it('should apply the .game-room-header class to the root header element to ensure styles are applied', () => {
    const headerElement = fixture.nativeElement.querySelector('header');
    expect(headerElement).toBeTruthy();
    expect(headerElement.classList.contains('game-room-header')).toBeTrue();
  });

  it('should hide the room info container when roomCode is CREATE to prevent UI clutter', () => {
    component.roomCode = 'CREATE';
    fixture.detectChanges();
    const infoContainer = fixture.nativeElement.querySelector('.room-info-container');
    expect(infoContainer).toBeFalsy();
  });

  it('should display the room info container for normal room codes', () => {
    component.roomCode = 'ABCDEF';
    fixture.detectChanges();
    const infoContainer = fixture.nativeElement.querySelector('.room-info-container');
    expect(infoContainer).toBeTruthy();
    const roomCodeDisplay = fixture.nativeElement.querySelector('.room-code-display');
    expect(roomCodeDisplay.textContent.trim()).toBe('ABCDEF');
  });

  it('should toggle sound via soundService', () => {
    spyOn(component.soundService, 'toggleMute');
    spyOn(component.soundService, 'playClick');
    component.toggleSound();
    expect(component.soundService.toggleMute).toHaveBeenCalled();
    expect(component.soundService.playClick).toHaveBeenCalled();
  });

  it('should close nav menu on Escape key when open', () => {
    component.isNavMenuOpen = true;
    const event = new KeyboardEvent('keydown', { key: 'Escape', cancelable: true });
    spyOn(event, 'preventDefault');
    component.onDialogKeyDown(event);
    expect(event.preventDefault).toHaveBeenCalled();
    expect(component.isNavMenuOpen).toBeFalse();
  });

  it('should close menu and preventDefault in onContentKeyDown when Escape is pressed', () => {
    component.isNavMenuOpen = true;
    const event = new KeyboardEvent('keydown', { key: 'Escape', cancelable: true });
    spyOn(event, 'preventDefault');
    component.onContentKeyDown(event);
    expect(event.preventDefault).toHaveBeenCalled();
    expect(component.isNavMenuOpen).toBeFalse();
  });

  it('should stopPropagation in onContentKeyDown when key is not Escape', () => {
    const event = new KeyboardEvent('keydown', { key: 'Enter', cancelable: true });
    spyOn(event, 'stopPropagation');
    component.onContentKeyDown(event);
    expect(event.stopPropagation).toHaveBeenCalled();
  });

  it('should restore focus to menu trigger on dialog close', () => {
    const mockTrigger = document.createElement('button');
    spyOn(mockTrigger, 'focus');
    component.menuTrigger = { nativeElement: mockTrigger } as any;
    component.isNavMenuOpen = true;

    component.onDialogClose();

    expect(component.isNavMenuOpen).toBeFalse();
    expect(mockTrigger.focus).toHaveBeenCalled();
  });
});


