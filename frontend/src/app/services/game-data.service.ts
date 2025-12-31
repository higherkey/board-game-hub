import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs'; // Import tap
import { environment } from '../../environments/environment';

export interface GameDefinition {
    id: string;
    name: string;
    icon: string;
    description: string;
    status: 'Deployed' | 'Testing' | 'Backlog';
    minPlayers: number;
    maxPlayers: number;
    complexity: number;
    averagePlayTime: number;
    tags: string;
}

@Injectable({
    providedIn: 'root'
})
export class GameDataService {
    private readonly apiUrl = environment.apiUrl + '/games';

    // Cache the games list
    private readonly gamesSubject = new BehaviorSubject<GameDefinition[] | null>(null);
    public readonly games$ = this.gamesSubject.asObservable();

    constructor(private readonly http: HttpClient) { }

    refreshGames(): void {
        this.http.get<GameDefinition[]>(this.apiUrl).subscribe(newGames => {
            const currentGames = this.gamesSubject.value;
            // Only update if data actually changed (or first load)
            if (!currentGames || JSON.stringify(newGames) !== JSON.stringify(currentGames)) {
                this.gamesSubject.next(newGames);
            }
        });
    }

    // Helper to get Status label if needed
    getStatusLabel(status: number): string {
        switch (status) {
            case 0: return 'Deployed';
            case 1: return 'Testing';
            case 2: return 'Backlog';
            default: return 'Unknown';
        }
    }
}
