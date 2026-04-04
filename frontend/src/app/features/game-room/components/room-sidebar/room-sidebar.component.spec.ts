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
});
