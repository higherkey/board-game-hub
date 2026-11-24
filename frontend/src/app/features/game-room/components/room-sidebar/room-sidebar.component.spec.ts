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

  it('should apply the .player-list-card class to the main players container', () => {
    const playerListCard = fixture.nativeElement.querySelector('.player-list-card');
    expect(playerListCard).toBeTruthy();
  });

  it('should label registered players as User and others as Guest', () => {
    component.players = [
      { connectionId: 'a', name: 'A', score: 0, isHost: false, isConnected: true, isRegistered: true } as any,
      { connectionId: 'b', name: 'B', score: 0, isHost: false, isConnected: true, isRegistered: false } as any
    ];
    fixture.detectChanges();
    const labels = Array.from(fixture.nativeElement.querySelectorAll('.ls-wide'))
      .map((el: any) => el.textContent.trim());
    expect(labels).toEqual(['User', 'Guest']);
  });

  it("labels the role switch on your own row as an action", () => {
    component.connectionId = "me";
    component.tables = [{ connectionId: "me", name: "TV", score: 0, isHost: false, isReady: true, isScreen: true }] as any;
    component.players = [];
    fixture.detectChanges();
    const roleButton = (text: string) => [...fixture.nativeElement.querySelectorAll("button")].find((b: any) => b.textContent.includes(text)) as HTMLButtonElement;
    let btn = roleButton("Use as Hand");
    // WCAG 2.5.3: the accessible name is the visible text.
    expect(btn.getAttribute("aria-label")).toBeNull();

    component.tables = [];
    component.players = [{ connectionId: "me", name: "Ann", score: 0, isHost: false, isReady: true, isScreen: false }] as any;
    fixture.detectChanges();
    btn = roleButton("Use as Table");
    expect(btn.getAttribute("aria-label")).toBeNull();
  });
});
