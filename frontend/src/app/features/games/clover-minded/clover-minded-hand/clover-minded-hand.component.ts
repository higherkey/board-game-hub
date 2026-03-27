import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { KeywordCard3dComponent } from '../components/keyword-card-3d/keyword-card-3d.component';
import { SignalRService, Room } from '../../../../services/signalr.service';
import {
    CloverMindedPhase,
    CloverMindedState
} from '../clover-minded.types';
import { CloverCardModel, CloverSlotState } from '../clover-minded.types';

@Component({
    selector: 'app-clover-minded-hand',
    standalone: true,
    imports: [CommonModule, FormsModule, KeywordCard3dComponent],
    template: `
        <div class="hand-root">
            <div class="hand-header">
                <div class="title">
                    <span class="emoji">🍀</span>
                    <span class="name">Your Hand</span>
                </div>

                <div class="phase-pill" *ngIf="state as s">
                    {{ phaseLabel(s.phase) }}
                </div>
            </div>

            <div class="hand-body" *ngIf="state as s; else notInGame">
                <ng-container *ngIf="!isInParticipantList(s); else inHandScope">
                    <div class="note">
                        Waiting for the next round… (you are currently Table-only)
                    </div>
                </ng-container>

                <ng-template #inHandScope>
                    <!-- CLUE WRITING -->
                    <div *ngIf="s.phase === phases.ClueWriting" class="clue-phase">
                        <div class="hint">
                            Look at your 4 pairs and write one single-word clue for each.
                            (Compounds/proper nouns/numbers are allowed.)
                        </div>

                        <div class="clue-zones">
                            <div class="clue-zone" *ngFor="let idx of [0,1,2,3]">
                                <div class="clue-zone-title">Pair {{ idx + 1 }}</div>
                                <div class="pair">
                                    {{ getMyPair(s, idx)?.[0] }} <span class="plus">+</span>
                                    {{ getMyPair(s, idx)?.[1] }}
                                </div>

                                <input class="clue-input" type="text"
                                    [(ngModel)]="draftClues[idx]"
                                    placeholder="Type your clue…"
                                    (keyup.enter)="submitCluesIfReady(s)">

                                <div class="micro" *ngIf="isSubmitted(s, idx)">
                                    Saved
                                </div>
                            </div>
                        </div>

                        <button class="primary-btn"
                            [disabled]="!canSubmitClues(s)"
                            (click)="submitClues(s)">
                            I'M DONE
                        </button>
                    </div>

                    <!-- RESOLUTION -->
                    <div *ngIf="s.phase === phases.Resolution || s.phase === phases.ResolutionSecond" class="resolution-phase">
                        <div class="spectator-banner" *ngIf="isSpectator(s)">
                            Spectator for this board. No team actions allowed.
                        </div>

                        <div class="resolution-grid" *ngIf="!isSpectator(s)">
                            <div class="pool-panel">
                                <div class="panel-title">
                                    Center Cards (select one)
                                </div>

                                <div class="pool-cards">
                                    <button class="pool-card"
                                        *ngFor="let c of s.pool"
                                        [class.selected]="selectedCardId === c.id"
                                        (click)="selectCard(c.id)">
                                        <app-keyword-card-3d
                                            [card]="c"
                                            [rotation]="0"
                                            [interactive]="false"
                                            [sizePx]="62">
                                        </app-keyword-card-3d>
                                    </button>
                                </div>
                            </div>

                            <div class="clover-panel">
                                <div class="panel-title">Place onto the Clover</div>
                                <div class="slot-grid">
                                    <div class="slot"
                                        *ngFor="let idx of [0,1,2,3]"
                                        [class.filled]="s.slots?.[idx]?.cardId"
                                        (click)="onSlotTap(idx)">

                                        <div class="slot-title">Slot {{ idx + 1 }}</div>

                                        <div class="slot-card" *ngIf="getSlotCard(s, idx) as card">
                                            <app-keyword-card-3d
                                                [card]="card"
                                                [rotation]="s.slots?.[idx]?.rotation || 0"
                                                [sizePx]="84"
                                                [placed]="true">
                                            </app-keyword-card-3d>
                                        </div>

                                        <div class="slot-empty" *ngIf="!getSlotCard(s, idx)">
                                            Tap to place
                                        </div>

                                        <div class="slot-actions" *ngIf="s.slots?.[idx]?.cardId">
                                            <button class="mini-btn"
                                                (click)="rotateSlot(idx); $event.stopPropagation()"
                                                [disabled]="!canRotateSlot(s, idx)">
                                                Rotate
                                            </button>
                                            <button class="mini-btn ghost"
                                                (click)="clearSlot(idx); $event.stopPropagation()">
                                                Clear
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <button class="guess-btn"
                                    [disabled]="!slotsFilled(s)"
                                    (click)="submitGuess(s)">
                                    GUESS
                                </button>

                                <div class="small-note" *ngIf="slotsFilled(s) && !isSpectator(s)">
                                    Team can submit once all 4 slots are filled.
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="footer-note">
                        {{ s.lastResult || s.message || '' }}
                    </div>
                </ng-template>
            </div>

            <ng-template #notInGame>
                <div class="empty-state">
                    Waiting for Clover-Minded to start…
                </div>
            </ng-template>
        </div>
    `,
    styleUrls: ['./clover-minded-hand.component.scss']
})
export class CloverMindedHandComponent implements OnChanges {
    @Input() room!: Room;
    @Input() myConnectionId: string = '';
    @Input() isHost = false;
    @Input() isScreen = false;

    phases = CloverMindedPhase;

    // clue drafts for clue-writing phase (4 clue zones).
    draftClues: string[] = ['', '', '', ''];
    selectedCardId: string | null = null;

    get state(): CloverMindedState | null {
        return (this.room?.gameData as CloverMindedState) ?? null;
    }

    constructor(private readonly signalRService: SignalRService) { }

    ngOnChanges(): void {
        // Reset draft when entering clue-writing for this game instance.
        const s = this.state;
        if (!s) return;
        if (s.phase === CloverMindedPhase.ClueWriting) {
            const alreadySubmitted = s.clueSubmitted?.[this.myConnectionId];
            if (!alreadySubmitted) {
                this.draftClues = ['', '', '', ''];
            }
        }
    }

    isInParticipantList(s: CloverMindedState): boolean {
        return !!s.participantIds?.includes(this.myConnectionId);
    }

    isSpectator(s: CloverMindedState): boolean {
        return !!s.currentSpectatorId && s.currentSpectatorId === this.myConnectionId;
    }

    phaseLabel(phase: string): string {
        switch (phase) {
            case CloverMindedPhase.ClueWriting:
                return 'Clue Writing (Private)';
            case CloverMindedPhase.Resolution:
                return 'Resolution (Attempt 1)';
            case CloverMindedPhase.ResolutionSecond:
                return 'Resolution (Attempt 2)';
            case CloverMindedPhase.BetweenRounds:
                return 'Between Boards';
            case CloverMindedPhase.GameOver:
                return 'Game Over';
            default:
                return phase;
        }
    }

    getMyPrep(s: CloverMindedState) {
        return s.prepByPlayer?.[this.myConnectionId];
    }

    getMyPair(s: CloverMindedState, idx: number): string[] | null {
        const prep = this.getMyPrep(s);
        if (!prep?.pairWords?.[idx]) return null;
        return prep.pairWords[idx];
    }

    isSubmitted(s: CloverMindedState, idx: number): boolean {
        // clueSubmitted is per player, not per clue zone.
        return !!s.clueSubmitted?.[this.myConnectionId];
    }

    canSubmitClues(s: CloverMindedState): boolean {
        if (s.phase !== CloverMindedPhase.ClueWriting) return false;
        if (s.clueSubmitted?.[this.myConnectionId]) return false;
        const clues = this.draftClues.map(c => (c ?? '').trim());
        return clues.length === 4 && clues.every(c => c.length > 0);
    }

    submitCluesIfReady(s: CloverMindedState) {
        if (this.canSubmitClues(s)) this.submitClues(s);
    }

    submitClues(s: CloverMindedState) {
        if (!this.canSubmitClues(s)) return;
        const clues = this.draftClues.map(c => (c ?? '').trim());
        this.signalRService.sendGameAction('CLOVER_SUBMIT_CLUES', { clues });
        // Optimistically keep local cleared.
    }

    selectCard(cardId: string) {
        if (!this.state) return;
        this.selectedCardId = cardId;
    }

    getSlotCard(s: CloverMindedState, slotIndex: number): CloverCardModel | null {
        const slots = s.slots;
        const cardId = slots?.[slotIndex]?.cardId ?? null;
        if (!cardId) return null;

        return s.pool?.find(c => c.id === cardId) ?? null;
    }

    slotsFilled(s: CloverMindedState): boolean {
        if (!s.slots || s.slots.length !== 4) return false;
        return s.slots.every(sl => !!sl?.cardId);
    }

    onSlotTap(slotIndex: number) {
        if (!this.state) return;
        const s = this.state;
        if (this.isSpectator(s)) return;
        if (s.phase !== CloverMindedPhase.Resolution && s.phase !== CloverMindedPhase.ResolutionSecond) return;
        if (s.slots?.[slotIndex]?.cardId) return; // already filled
        if (!this.selectedCardId) return;

        this.signalRService.sendGameAction('CLOVER_SET_SLOT', {
            slotIndex,
            cardId: this.selectedCardId,
            rotation: 0
        });
    }

    clearSlot(slotIndex: number) {
        const s = this.state;
        if (!s || this.isSpectator(s)) return;
        this.signalRService.sendGameAction('CLOVER_CLEAR_SLOT', { slotIndex });
    }

    rotateSlot(slotIndex: number) {
        const s = this.state;
        if (!s || this.isSpectator(s)) return;
        this.signalRService.sendGameAction('CLOVER_ROTATE_SLOT', { slotIndex });
    }

    canRotateSlot(s: CloverMindedState, slotIndex: number): boolean {
        if (this.room?.settings?.cloverAllowPerPlayerSingleCardRotation !== true) return false;
        const slot = s.slots?.[slotIndex];
        if (!slot?.cardId) return false;

        const used = s.rotationCardIdByPlayerThisAttempt?.[this.myConnectionId] ?? null;
        if (!used) return true; // haven't rotated yet this attempt
        return used === slot.cardId;
    }

    submitGuess(s: CloverMindedState) {
        if (this.isSpectator(s)) return;
        if (!this.slotsFilled(s)) return;
        this.signalRService.sendGameAction('CLOVER_SUBMIT_GUESS', {});
    }
}

