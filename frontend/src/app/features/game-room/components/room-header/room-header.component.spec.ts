import { Component, Input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RoomHeaderComponent } from './room-header.component';
import { UserProfileDropdownComponent } from '../../../../shared/components/user-profile-dropdown/user-profile-dropdown.component';

@Component({ selector: 'app-user-profile-dropdown', template: '', standalone: true })
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
});
