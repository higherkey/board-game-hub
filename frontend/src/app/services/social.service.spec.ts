import { TestBed } from '@angular/core/testing';
import { SocialService } from './social.service';
import { AuthService } from './auth.service';

describe('SocialService', () => {
    let service: SocialService;
    let mockAuthService: jasmine.SpyObj<AuthService>;

    beforeEach(() => {
        mockAuthService = jasmine.createSpyObj('AuthService', ['getToken']);
        mockAuthService.getToken.and.returnValue('fake-token');

        TestBed.configureTestingModule({
            providers: [
                SocialService,
                { provide: AuthService, useValue: mockAuthService }
            ]
        });
        
        service = TestBed.inject(SocialService);
        
        // Mock SignalR Hub Connection properties to avoid starting real connections
        (service as any).hubConnection = jasmine.createSpyObj('HubConnection', ['start', 'stop', 'on', 'invoke', 'onclose', 'onreconnecting', 'onreconnected']);
        (service as any).hubConnection.state = 'Disconnected';
        (service as any).hubConnection.start.and.returnValue(Promise.resolve());
        (service as any).hubConnection.stop.and.returnValue(Promise.resolve());
        (service as any).hubConnection.invoke.and.returnValue(Promise.resolve([]));
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should start connection and load initial data', async () => {
        await service.startConnection();
        await new Promise(r => setTimeout(r, 0));
        
        expect((service as any).hubConnection.start).toHaveBeenCalled();
        expect((service as any).hubConnection.invoke).toHaveBeenCalledWith('GetGlobalChatHistory');
        expect((service as any).hubConnection.invoke).toHaveBeenCalledWith('GetFriendRequests');
        expect((service as any).hubConnection.invoke).toHaveBeenCalledWith('GetFriends');
    });

    it('should invoke SendMessage', async () => {
        await service.sendMessage('user1', 'Hello!');
        expect((service as any).hubConnection.invoke).toHaveBeenCalledWith('SendMessage', 'user1', 'Hello!');
    });

    it('should invoke SendGlobalMessage', async () => {
        await service.sendGlobalMessage('Global Hello!');
        expect((service as any).hubConnection.invoke).toHaveBeenCalledWith('SendGlobalMessage', 'Global Hello!');
    });

    it('should invoke SendFriendRequest', async () => {
        await service.sendFriendRequest('user1');
        expect((service as any).hubConnection.invoke).toHaveBeenCalledWith('SendFriendRequest', 'user1');
    });

    it('should invoke AcceptFriendRequest', async () => {
        await service.acceptFriendRequest('req1');
        expect((service as any).hubConnection.invoke).toHaveBeenCalledWith('AcceptFriendRequest', 'req1');
    });

    it('should invoke RemoveFriend', async () => {
        await service.removeFriend('friend1');
        expect((service as any).hubConnection.invoke).toHaveBeenCalledWith('RemoveFriend', 'friend1');
    });

    it('should stop connection on stopConnection', async () => {
        (service as any).hubConnection.state = 'Connected';
        await service.stopConnection();
        expect((service as any).hubConnection.stop).toHaveBeenCalled();
    });
});
