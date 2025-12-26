import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';

export interface RoomStats {
    activeRooms: number;
    totalOnlinePlayers: number;
    uptime: string;
    rooms: RoomSummary[];
}

export interface RoomSummary {
    code: string;
    hostName: string;
    gameType: string;
    playerCount: number;
    globalState: string;
    isPublic: boolean;
    settingsTimer: number;
    players: PlayerSummary[];
    roundNumber: number;
}

export interface PlayerSummary {
    connectionId: string;
    name: string;
    score: number;
    isHost: boolean;
    userId?: string;
}

@Injectable({
    providedIn: 'root'
})
export class AdminService {
    private readonly baseUrl = '/admin'; // Use relative path for standalone deployment compat
    private hubConnection: HubConnection | null = null;
    private readonly statsSubject = new BehaviorSubject<RoomStats | null>(null);
    public stats$ = this.statsSubject.asObservable();

    constructor(private readonly http: HttpClient) { }

    public async startConnection() {
        if (this.hubConnection) return;

        this.hubConnection = new HubConnectionBuilder()
            .withUrl('/adminhub', {
                accessTokenFactory: () => localStorage.getItem('auth_token') || ''
            })
            .withAutomaticReconnect()
            .build();

        this.hubConnection.on('StatsUpdated', (stats: RoomStats) => {
            this.statsSubject.next(stats);
        });

        try {
            await this.hubConnection.start();
            console.log('AdminHub connection started');
            // Fetch initial stats
            this.getStats().subscribe(stats => this.statsSubject.next(stats));
        } catch (err) {
            console.error('Error while starting AdminHub connection: ' + err);
        }
    }

    public async stopConnection() {
        if (this.hubConnection) {
            await this.hubConnection.stop();
            this.hubConnection = null;
        }
    }

    getStats(): Observable<RoomStats> {
        return this.http.get<RoomStats>(`${this.baseUrl}/stats`);
    }

    createRoom(hostName: string, gameType: string): Observable<{ code: string }> {
        return this.http.post<{ code: string }>(`${this.baseUrl}/rooms/create`, { hostName, gameType });
    }

    createRoomWithCode(code: string, hostName: string, gameType: string): Observable<{ code: string }> {
        // The backend strictly generates GUIDs now in the controller shown, 
        // but if we need custom codes, we'd need to update the backend.
        // For now, adhering to the existing controller contract.
        return this.createRoom(hostName, gameType);
    }

    startGame(code: string): Observable<void> {
        return this.http.post<void>(`${this.baseUrl}/rooms/${code}/start`, {});
    }

    terminateRoom(code: string): Observable<void> {
        return this.http.post<void>(`${this.baseUrl}/rooms/${code}/terminate`, {});
    }

    updateSettings(code: string, timerDurationSeconds: number): Observable<void> {
        return this.http.post<void>(`${this.baseUrl}/rooms/${code}/settings`, { timerDurationSeconds });
    }

    getGames(): Observable<any[]> {
        return this.http.get<any[]>(`${this.baseUrl}/games`);
    }

    updateGame(id: string, game: any): Observable<any> {
        return this.http.put<any>(`${this.baseUrl}/games/${id}`, game);
    }

    sendGlobalMessage(message: string): Observable<void> {
        return this.http.post<void>(`${this.baseUrl}/rooms/message`, { message, target: 'global' });
    }
}
