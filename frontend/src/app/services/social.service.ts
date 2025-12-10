import { Injectable } from '@angular/core';
import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';
import { BehaviorSubject } from 'rxjs';
import { AuthService } from './auth.service';

export interface ChatMessage {
    senderId: string;
    message: string;
    timestamp: Date;
}

export interface FriendRequest {
    senderId: string;
    senderName?: string;
}

@Injectable({
    providedIn: 'root'
})
export class SocialService {
    private readonly hubConnection: HubConnection;
    private readonly messagesSubject = new BehaviorSubject<ChatMessage[]>([]);
    private readonly friendRequestsSubject = new BehaviorSubject<FriendRequest[]>([]);

    public messages$ = this.messagesSubject.asObservable();
    public friendRequests$ = this.friendRequestsSubject.asObservable();

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
            messages.push({ senderId, message, timestamp: new Date() });
            this.messagesSubject.next([...messages]);
        });

        this.hubConnection.on('ReceiveGlobalMessage', (senderId: string, message: string) => {
            const messages = this.messagesSubject.value;
            messages.push({ senderId, message, timestamp: new Date() });
            this.messagesSubject.next([...messages]);
        });

        this.hubConnection.on('ReceiveFriendRequest', (senderId: string) => {
            const requests = this.friendRequestsSubject.value;
            requests.push({ senderId });
            this.friendRequestsSubject.next([...requests]);
        });

        this.hubConnection.on('FriendRequestAccepted', (userId: string) => {
            console.log('Friend request accepted by:', userId);
        });
    }

    public async startConnection(): Promise<void> {
        if (this.hubConnection.state === 'Disconnected') {
            try {
                await this.hubConnection.start();
                console.log('SocialHub connected');
            } catch (err) {
                console.error('Error connecting to SocialHub:', err);
            }
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
    }

    public async stopConnection(): Promise<void> {
        if (this.hubConnection.state === 'Connected') {
            await this.hubConnection.stop();
        }
    }
}
