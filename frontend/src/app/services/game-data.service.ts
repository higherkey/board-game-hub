import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs'; // Import tap
import { environment } from '../../environments/environment';

export interface GameDefinition {
    id: string;
    name: string;
    icon: string;
    description: string;
    status: 'Deployed' | 'Testing' | 'Backlog';
}

@Injectable({
    providedIn: 'root'
})
export class GameDataService {
    private readonly apiUrl = environment.apiUrl + '/games';

    // Cache the games list
    private readonly gamesSubject = new BehaviorSubject<GameDefinition[]>([]);
    public readonly games$ = this.gamesSubject.asObservable();

    constructor(private readonly http: HttpClient) { }

    loadGames(): Observable<GameDefinition[]> {
        return this.http.get<GameDefinition[]>(this.apiUrl).pipe(
            tap(games => this.gamesSubject.next(games))
        );
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
