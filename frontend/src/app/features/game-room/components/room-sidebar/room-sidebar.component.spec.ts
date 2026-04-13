import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RoomSidebarComponent } from './room-sidebar.component';

describe('RoomSidebarComponent', () => {
  let component: RoomSidebarComponent;
  let fixture: ComponentFixture<RoomSidebarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RoomSidebarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RoomSidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should return false for checkIsCreator when room is null', () => {
    expect(component.checkIsCreator(null, 'conn1')).toBeFalse();
  });

  it('should identify creator correctly', () => {
    const mockRoom: any = { creatorConnectionId: 'conn1' };
    expect(component.checkIsCreator(mockRoom, 'conn1')).toBeTrue();
    expect(component.checkIsCreator(mockRoom, 'conn2')).toBeFalse();
  });

  it('should emit toggleSidebar', () => {
    spyOn(component.toggleSidebar, 'emit');
    component.toggleSidebar.emit();
    expect(component.toggleSidebar.emit).toHaveBeenCalled();
  });

  it('should emit setHostPlayer', () => {
    spyOn(component.setHostPlayer, 'emit');
    component.setHostPlayer.emit('user1');
    expect(component.setHostPlayer.emit).toHaveBeenCalledWith('user1');
  });

  it('should emit removeHostPlayer', () => {
    spyOn(component.removeHostPlayer, 'emit');
    component.removeHostPlayer.emit('user1');
    expect(component.removeHostPlayer.emit).toHaveBeenCalledWith('user1');
  });

  it('should emit changeRole', () => {
    spyOn(component.changeRole, 'emit');
    component.changeRole.emit(true);
    expect(component.changeRole.emit).toHaveBeenCalledWith(true);
  });
});
