import { Injectable } from '@angular/core';
import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';
import { BehaviorSubject } from 'rxjs';
import { AuthService } from './auth.service';

export interface ChatMessage {
    senderId: string;
    content: string;
    timestamp: Date;
    sender?: any;
}

export interface FriendRequest {
    requesterId: string; // Adjusted to match backend 'RequesterId' or usage
    requesterName?: string;
    senderId?: string; // Keep for compatibility if needed
}

@Injectable({
    providedIn: 'root'
})
export class SocialService {
    private readonly hubConnection: HubConnection;
    private readonly messagesSubject = new BehaviorSubject<ChatMessage[]>([]);
    private readonly friendRequestsSubject = new BehaviorSubject<FriendRequest[]>([]);
    private readonly friendsSubject = new BehaviorSubject<any[]>([]);

    public messages$ = this.messagesSubject.asObservable();
    public friendRequests$ = this.friendRequestsSubject.asObservable();
    public friends$ = this.friendsSubject.asObservable();

    constructor(private authService: AuthService) {
        const token = this.authService.getToken();

        this.hubConnection = new HubConnectionBuilder()
            .withUrl('http://localhost:5109/socialhub', {
                accessTokenFactory: () => token || ''
            })
            .withAutomaticReconnect()
            .build();

        this.setupListeners();
    }

    private setupListeners() {
        this.hubConnection.on('ReceiveMessage', (senderId: string, message: string) => {
            const messages = this.messagesSubject.value;
            messages.push({ senderId, content: message, timestamp: new Date() });
            this.messagesSubject.next([...messages]);
        });

        this.hubConnection.on('ReceiveGlobalMessage', (senderId: string, message: string) => {
            const messages = this.messagesSubject.value;
            messages.push({ senderId, content: message, timestamp: new Date() });
            this.messagesSubject.next([...messages]);
        });

        this.hubConnection.on('ReceiveFriendRequest', (senderId: string) => {
            const requests = this.friendRequestsSubject.value;
            requests.push({ requesterId: senderId, senderId });
            this.friendRequestsSubject.next([...requests]);
        });

        this.hubConnection.on('FriendRequestAccepted', (userId: string) => {
            console.log('Friend request accepted by:', userId);
            this.loadFriends(); // Refresh friends list
        });
    }

    public async startConnection(): Promise<void> {
        if (this.hubConnection.state === 'Disconnected') {
            try {
                await this.hubConnection.start();
                console.log('SocialHub connected');
                this.loadInitialData();
            } catch (err) {
                console.error('Error connecting to SocialHub:', err);
            }
        }
    }

    private async loadInitialData() {
        await this.loadGlobalChatHistory();
        await this.loadFriendRequests();
        await this.loadFriends();
    }

    public async loadGlobalChatHistory() {
        try {
            const history = await this.hubConnection.invoke<any[]>('GetGlobalChatHistory');
            // Check mapping
            const mapped = history.map(m => ({
                senderId: m.senderId,
                content: m.content,
                timestamp: new Date(m.timestamp),
                sender: m.sender
            }));
            // Sort by timestamp if needed, but backend sends sorted?
            // Merge with existing? Or replace? 
            // For now replace initial load.
            this.messagesSubject.next(mapped);
        } catch (e) {
            console.error('Failed to load chat history', e);
        }
    }

    public async loadFriends() {
        try {
            const friends = await this.hubConnection.invoke<any[]>('GetFriends');
            this.friendsSubject.next(friends);
        } catch (e) {
            console.error('Failed to load friends', e);
        }
    }

    public async loadFriendRequests() {
        // Gets pending requests
        try {
            const requests = await this.hubConnection.invoke<any[]>('GetFriendRequests');
            // Map backend Friendship object to simpler structure if needed
            // Backend returns List<Friendship>. Friendship has Requester and Addressee.
            // Since we are the addressee, we care about Requester.
            const mapped = requests.map(r => ({
                requesterId: r.requesterId,
                requesterName: r.requester?.displayName,
                senderId: r.requesterId
            }));
            this.friendRequestsSubject.next(mapped);
        } catch (e) {
            console.error('Failed to load friend requests', e);
        }
    }

    public async sendMessage(targetUserId: string, message: string): Promise<void> {
        await this.hubConnection.invoke('SendMessage', targetUserId, message);
    }

    public async sendGlobalMessage(message: string): Promise<void> {
        await this.hubConnection.invoke('SendGlobalMessage', message);
    }

    public async sendFriendRequest(targetUserId: string): Promise<void> {
        await this.hubConnection.invoke('SendFriendRequest', targetUserId);
    }

    public async acceptFriendRequest(requesterId: string): Promise<void> {
        await this.hubConnection.invoke('AcceptFriendRequest', requesterId);
        // Refresh?
        setTimeout(() => this.loadFriends(), 500);
    }

    public async stopConnection(): Promise<void> {
        if (this.hubConnection.state === 'Connected') {
            await this.hubConnection.stop();
        }
    }
}
