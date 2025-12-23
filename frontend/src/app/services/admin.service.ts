import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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
    private readonly baseUrl = 'http://localhost:5109/admin'; // Direct backend URL for now

    constructor(private readonly http: HttpClient) { }

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

    sendGlobalMessage(message: string): Observable<void> {
        return this.http.post<void>(`${this.baseUrl}/rooms/message`, { message, target: 'global' });
    }
}
