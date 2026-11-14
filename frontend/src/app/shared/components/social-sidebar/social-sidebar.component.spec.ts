import { fakeAsync, tick } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
import { SocialSidebarComponent } from './social-sidebar.component';
import { ChatMessage, FriendRequest } from '../../../services/social.service';

describe('SocialSidebarComponent lifecycle', () => {
  let component: SocialSidebarComponent;
  let social: any;
  let logger: any;
  let auth: any;

  beforeEach(() => {
    social = {
      messages$: new BehaviorSubject<ChatMessage[]>([]),
      friendRequests$: new BehaviorSubject<FriendRequest[]>([]),
      startConnection: jasmine.createSpy('startConnection').and.resolveTo(),
      stopConnection: jasmine.createSpy('stopConnection').and.resolveTo()
    };
    auth = { isAuthenticated: jasmine.createSpy('isAuthenticated').and.returnValue(true) };
    logger = { error: jasmine.createSpy('error') };
    component = new SocialSidebarComponent(social, auth, logger);
  });

  it('does not subscribe after destruction while connection startup is pending', fakeAsync(() => {
    let finishConnection!: () => void;
    social.startConnection.and.returnValue(new Promise<void>(resolve => finishConnection = resolve));
    expect(component.ngOnInit()).toBeUndefined();
    const messages = [{ senderId: 'a', content: 'before', timestamp: new Date() }];
    social.messages$.next(messages);
    expect(component.messages).toEqual(messages);
    component.ngOnDestroy();
    finishConnection();
    tick();
    social.messages$.next([]);
    social.friendRequests$.next([{ requesterId: 'late' }]);
    expect(component.messages).toEqual(messages);
    expect(component.friendRequests).toEqual([]);
    expect(social.stopConnection).toHaveBeenCalled();
  }));

  it('reports startup and shutdown rejections', fakeAsync(() => {
    social.startConnection.and.rejectWith('offline');
    social.stopConnection.and.rejectWith('stop failure');
    component.ngOnInit();
    tick();
    expect(logger.error).toHaveBeenCalledWith('Failed to connect social sidebar', 'offline');
    component.ngOnDestroy();
    tick();
    expect(logger.error).toHaveBeenCalledWith('Failed to disconnect social sidebar', 'stop failure');
  }));

  it('does not connect or subscribe for a guest', () => {
    auth.isAuthenticated.and.returnValue(false);
    component.ngOnInit();
    social.messages$.next([{ senderId: 'a', content: 'hidden', timestamp: new Date() }]);
    expect(social.startConnection).not.toHaveBeenCalled();
    expect(component.messages).toEqual([]);
    component.ngOnDestroy();
  });
});
