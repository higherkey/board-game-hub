import { Injectable } from '@angular/core';
import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';
import { AuthService } from './auth.service';

export interface ServerStats {
    activeRooms: number;
    totalOnlinePlayers: number;
    uptime: string;
    rooms: RoomSummary[];
}

export interface PlayerSummary {
    name: string;
    isHost: boolean;
    score: number;
    userId?: string;
    connectionId?: string;
}

export interface RoomSummary {
    code: string;
    globalState: string;
    gameType: string;
    playerCount: number;
    isPublic: boolean;
    hostName: string;
    players: PlayerSummary[];
}

@Injectable({
    providedIn: 'root'
})
export class AdminService {
    private readonly hubConnection: HubConnection;

    constructor(private readonly authService: AuthService) {
        const token = this.authService.getToken();

        this.hubConnection = new HubConnectionBuilder()
            .withUrl('http://localhost:5109/adminhub', {
                accessTokenFactory: () => token || ''
            })
            .withAutomaticReconnect()
            .build();
    }

    public async startConnection(): Promise<void> {
        if (this.hubConnection.state === 'Disconnected') {
            await this.hubConnection.start();
        }
    }

    public async stopConnection(): Promise<void> {
        if (this.hubConnection.state === 'Connected') {
            await this.hubConnection.stop();
        }
    }

    public async getStats(): Promise<ServerStats> {
        return await this.hubConnection.invoke<ServerStats>('GetStats');
    }

    public async kickPlayer(roomCode: string, connectionId: string): Promise<void> {
        return await this.hubConnection.invoke('KickPlayer', roomCode, connectionId);
    }

    public async promoteToHost(roomCode: string, connectionId: string): Promise<void> {
        return await this.hubConnection.invoke('PromoteToHost', roomCode, connectionId);
    }
}
