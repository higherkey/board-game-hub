import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges } from '@angular/core';
import { Room, SignalRService } from '../../../../services/signalr.service';
import {
    CloverMindedPhase,
    CloverMindedState
} from '../clover-minded.types';
import { KeywordCard3dComponent } from '../components/keyword-card-3d/keyword-card-3d.component';
import { CloverCardModel, CloverSlotState } from '../clover-minded.types';

@Component({
    selector: 'app-clover-minded-table',
    standalone: true,
    imports: [CommonModule, KeywordCard3dComponent],
    template: `
        <div class="table-root">
            <div class="table-header">
                <div class="title">
                    <span class="emoji">🍀</span>
                    <span class="name">Clover-Minded</span>
                </div>

                <div class="status">
                    <span class="pill" *ngIf="state as s">
                        {{ phaseLabel(s.phase) }}
                    </span>
                </div>
            </div>

            <div class="table-body" *ngIf="state as s; else waiting">
                <div class="top-row">
                    <div class="spectator-box" *ngIf="s.currentSpectatorId && s.phase !== phases.ClueWriting">
                        <div class="label">Spectator</div>
                        <div class="value">
                            {{ getPlayerName(s.currentSpectatorId) }}
                        </div>
                        <div class="sub">
                            Attempt {{ s.resolutionAttempt }}
                        </div>
                    </div>

                    <div class="clue-progress" *ngIf="s.phase === phases.ClueWriting">
                        <div class="label">Hands Clues</div>
                        <div class="value">
                            {{ getClueSubmittedCount(s) }}/{{ s.participantIds.length }}
                            completed
                        </div>
                        <div class="sub">Table waits while Hands submit.</div>
                    </div>

                    <div class="message" *ngIf="s.message || s.lastResult">
                        {{ s.message || s.lastResult }}
                    </div>
                </div>

                <div class="grid">
                    <!-- Board -->
                    <div class="board-wrap">
                        <div class="clover-board">
                            <div class="center-disk"></div>

                            <div class="leaf leaf-0">
                                <div class="clue-zone">
                                    <div class="clue-title">Clue 1</div>
                                    <div class="clue-word">{{ s.currentClues?.[0] || '...' }}</div>
                                    <div class="pair" *ngIf="getPairWords(0) as pair">
                                        {{ pair[0] }} + {{ pair[1] }}
                                    </div>
                                </div>
                                <div class="leaf-card" *ngIf="getSlotCard(0) as card">
                                    <app-keyword-card-3d
                                        [card]="card"
                                        [rotation]="s.slots?.[0]?.rotation || 0"
                                        [sizePx]="90"
                                        [placed]="true">
                                    </app-keyword-card-3d>
                                </div>
                            </div>

                            <div class="leaf leaf-1">
                                <div class="clue-zone">
                                    <div class="clue-title">Clue 2</div>
                                    <div class="clue-word">{{ s.currentClues?.[1] || '...' }}</div>
                                    <div class="pair" *ngIf="getPairWords(1) as pair">
                                        {{ pair[0] }} + {{ pair[1] }}
                                    </div>
                                </div>
                                <div class="leaf-card" *ngIf="getSlotCard(1) as card">
                                    <app-keyword-card-3d
                                        [card]="card"
                                        [rotation]="s.slots?.[1]?.rotation || 0"
                                        [sizePx]="90"
                                        [placed]="true">
                                    </app-keyword-card-3d>
                                </div>
                            </div>

                            <div class="leaf leaf-2">
                                <div class="clue-zone">
                                    <div class="clue-title">Clue 3</div>
                                    <div class="clue-word">{{ s.currentClues?.[2] || '...' }}</div>
                                    <div class="pair" *ngIf="getPairWords(2) as pair">
                                        {{ pair[0] }} + {{ pair[1] }}
                                    </div>
                                </div>
                                <div class="leaf-card" *ngIf="getSlotCard(2) as card">
                                    <app-keyword-card-3d
                                        [card]="card"
                                        [rotation]="s.slots?.[2]?.rotation || 0"
                                        [sizePx]="90"
                                        [placed]="true">
                                    </app-keyword-card-3d>
                                </div>
                            </div>

                            <div class="leaf leaf-3">
                                <div class="clue-zone">
                                    <div class="clue-title">Clue 4</div>
                                    <div class="clue-word">{{ s.currentClues?.[3] || '...' }}</div>
                                    <div class="pair" *ngIf="getPairWords(3) as pair">
                                        {{ pair[0] }} + {{ pair[1] }}
                                    </div>
                                </div>
                                <div class="leaf-card" *ngIf="getSlotCard(3) as card">
                                    <app-keyword-card-3d
                                        [card]="card"
                                        [rotation]="s.slots?.[3]?.rotation || 0"
                                        [sizePx]="90"
                                        [placed]="true">
                                    </app-keyword-card-3d>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Pool -->
                    <div class="pool-wrap">
                        <div class="pool-title">Center Cards</div>
                        <div class="pool-cards">
                            <div class="pool-card"
                                *ngFor="let c of s.pool"
                                [class.dimmed]="!c || !c.id">
                                <app-keyword-card-3d
                                    [card]="c"
                                    [rotation]="0"
                                    [interactive]="false"
                                    [sizePx]="70"
                                    [dimmed]="false">
                                </app-keyword-card-3d>
                            </div>
                        </div>
                        <div class="pool-hint">
                            Team places the 4 real cards on the clover. Rotation matters.
                        </div>
                    </div>
                </div>
            </div>

            <ng-template #waiting>
                <div class="empty-state">
                    Waiting for the Clover game to start…
                </div>
            </ng-template>
        </div>
    `,
    styleUrls: ['./clover-minded-table.component.scss']
})
export class CloverMindedTableComponent implements OnChanges {
    @Input() room!: Room;

    // The base game-room passes both Table/Hand roles, but this component is Table-only.
    @Input() myConnectionId: string = '';
    @Input() isHost = false;
    @Input() isScreen = true;

    phases = CloverMindedPhase;

    get state(): CloverMindedState | null {
        return (this.room?.gameData as CloverMindedState) ?? null;
    }

    getSlotCard(slotIndex: number): CloverCardModel | null {
        const s = this.state;
        if (!s?.slots || !s.pool) return null;
        const cardId = s.slots?.[slotIndex]?.cardId;
        if (!cardId) return null;

        // Prefer cards from current pool.
        const fromPool = s.pool.find(c => c.id === cardId);
        if (fromPool) return fromPool;

        // Fallback: spectator's original 4 cards (should still exist by id).
        const spectatorId = s.currentSpectatorId;
        const prep = spectatorId ? s.prepByPlayer?.[spectatorId] : undefined;
        return prep?.cards?.find(c => c.id === cardId) ?? null;
    }

    private pairEdgeIndices(zoneIndex: number): [number, number] {
        // Must match backend CloverGeometry.PairEdgeIndices.
        const edgeA = [1, 2, 3, 0];
        const edgeB = [0, 0, 2, 3];
        return [edgeA[zoneIndex], edgeB[zoneIndex]];
    }

    getPairWords(zoneIndex: number): [string, string] | null {
        const s = this.state;
        if (!s?.slots || !s.currentClues || s.slots.length !== 4) return null;

        const slotI = s.slots[zoneIndex];
        const slotIp1 = s.slots[(zoneIndex + 1) % 4];
        if (!slotI?.cardId || !slotIp1?.cardId) return null;

        const [edgeOnI, edgeOnIp1] = this.pairEdgeIndices(zoneIndex);
        const cardI = this.getSlotCard(zoneIndex);
        const cardIp1 = this.getSlotCard((zoneIndex + 1) % 4);
        if (!cardI || !cardIp1) return null;

        const rI = ((slotI.rotation % 4) + 4) % 4;
        const rIp1 = ((slotIp1.rotation % 4) + 4) % 4;
        const wA = cardI.words[(edgeOnI + rI) % 4] ?? '';
        const wB = cardIp1.words[(edgeOnIp1 + rIp1) % 4] ?? '';
        return [wA, wB];
    }

    getClueSubmittedCount(s: CloverMindedState): number {
        return Object.values(s.clueSubmitted ?? {}).filter(Boolean).length;
    }

    getPlayerName(connectionId: string): string {
        const p = this.room?.players?.find(pl => pl.connectionId === connectionId);
        return p?.name ?? 'Unknown';
    }

    phaseLabel(phase: string): string {
        switch (phase) {
            case CloverMindedPhase.ClueWriting:
                return 'Clue Writing';
            case CloverMindedPhase.Resolution:
                return 'Resolution (Attempt 1)';
            case CloverMindedPhase.ResolutionSecond:
                return 'Resolution (Attempt 2)';
            case CloverMindedPhase.BetweenRounds:
                return 'Between Spectators';
            case CloverMindedPhase.GameOver:
                return 'Game Over';
            default:
                return phase;
        }
    }

    ngOnChanges(): void {
        // No-op: renders from server-pushed state.
    }
}

