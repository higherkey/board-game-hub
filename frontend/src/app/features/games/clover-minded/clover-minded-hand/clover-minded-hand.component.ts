import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { KeywordCard3dComponent } from '../components/keyword-card-3d/keyword-card-3d.component';
import { SignalRService, Room } from '../../../../services/signalr.service';
import {
    CloverMindedPhase,
    CloverMindedState,
    CloverCardModel,
    CloverSlotState
} from '../clover-minded.types';
import { gsap } from 'gsap';
import { throttleTime, Subject } from 'rxjs';

@Component({
    selector: 'app-clover-minded-hand',
    standalone: true,
    imports: [CommonModule, FormsModule, KeywordCard3dComponent],
    templateUrl: './clover-minded-hand.component.html',
    styleUrls: ['./clover-minded-hand.component.scss']
})
export class CloverMindedHandComponent implements OnInit, OnChanges, OnDestroy {
    @Input() room!: Room;
    @Input() myConnectionId: string = '';
    @Input() isHost = false;
    @Input() isScreen = false;

    phases = CloverMindedPhase;

    // clue drafts for clue-writing phase (4 clue zones).
    draftClues: string[] = ['', '', '', ''];
    selectedCardId: string | null = null;
    isSubmitting = false;

    // Drag State
    isDragging = false;
    draggedCardId: string | null = null;
    dragX = 0;
    dragY = 0;
    currentHoverSlot: number | null = null;
    private dragMove$ = new Subject<{ x: number, y: number }>();

    get state(): CloverMindedState | null {
        return (this.room?.gameData as CloverMindedState) ?? null;
    }

    constructor(private readonly signalRService: SignalRService) { }

    ngOnInit(): void {
        // Throttle drag updates to 15fps (66ms) to avoid flooding SignalR while keeping it smooth
        this.dragMove$.pipe(throttleTime(66)).subscribe(pos => {
            if (this.draggedCardId) {
                // Normalize to 0..1 for the Table's responsive grid
                const normX = pos.x / window.innerWidth;
                const normY = pos.y / window.innerHeight;
                this.signalRService.cloverDragMove(this.draggedCardId, normX, normY);
            }
        });
    }

    ngOnDestroy(): void {
        this.dragMove$.complete();
        gsap.killTweensOf('.clue-zone');
    }

    ngOnChanges(changes: SimpleChanges): void {
        const s = this.state;
        if (!s) return;

        // Reset draft if not submitted
        if (s.phase === CloverMindedPhase.ClueWriting) {
            const alreadySubmitted = s.clueSubmitted?.[this.myConnectionId];
            if (!alreadySubmitted) {
                this.isSubmitting = false;
            }
        }

        // Detect Round Start / Arrival of cards
        if (changes['room']) {
            const prevState = changes['room'].previousValue?.gameData as CloverMindedState;
            if (s.phase === CloverMindedPhase.ClueWriting && (!prevState || prevState.phase !== s.phase)) {
                this.animateArrival();
            }
        }
    }

    private animateArrival() {
        // Subtle juice when cards "arrive"
        setTimeout(() => {
            gsap.from('.clue-zone', {
                y: 50,
                opacity: 0,
                duration: 0.6,
                stagger: 0.1,
                ease: 'back.out(1.4)'
            });
        }, 1000); // delay to match Table's dealing animation
    }

    // --- Drag Handlers ---
    onCardTouchStart(event: TouchEvent, cardId: string) {
        const s = this.state;
        if (!s || this.isSpectator(s)) return;
        
        // Check occupation
        if (this.isOccupiedByOthers(s, cardId)) return;

        this.isDragging = true;
        this.draggedCardId = cardId;
        this.updateDragPosition(event);

        // Notify server of grab (Locking)
        this.signalRService.sendGameAction('CLOVER_GRAB_CARD', { cardId });
    }

    onCardTouchMove(event: TouchEvent) {
        if (!this.isDragging) return;
        event.preventDefault(); // Prevent scroll while dragging
        this.updateDragPosition(event);
        
        this.dragMove$.next({ x: this.dragX, y: this.dragY });

        // Check for hover over slots
        this.checkSlotHover(this.dragX, this.dragY);
    }

    onCardTouchEnd(event: TouchEvent) {
        if (!this.isDragging || !this.draggedCardId) return;

        const targetSlot = this.currentHoverSlot;
        const cardId = this.draggedCardId;

        this.isDragging = false;
        this.draggedCardId = null;
        this.currentHoverSlot = null;

        if (targetSlot !== null) {
            this.signalRService.sendGameAction('CLOVER_SET_SLOT', {
                slotIndex: targetSlot,
                cardId: cardId,
                rotation: 0
            });
        } else {
            // Just release lock
            this.signalRService.sendGameAction('CLOVER_RELEASE_CARD', { cardId });
        }
    }

    private updateDragPosition(event: TouchEvent) {
        const touch = event.touches[0] || event.changedTouches[0];
        this.dragX = touch.clientX;
        this.dragY = touch.clientY;
    }

    private checkSlotHover(x: number, y: number) {
        for (let i = 0; i < 4; i++) {
            const el = document.getElementById(`slot-${i}`);
            if (el) {
                const rect = el.getBoundingClientRect();
                if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
                    this.currentHoverSlot = i;
                    return;
                }
            }
        }
        this.currentHoverSlot = null;
    }

    getDraggedCard(): CloverCardModel | null {
        return this.state?.pool?.find(c => c.id === this.draggedCardId) ?? null;
    }

    isOccupiedByOthers(s: CloverMindedState, cardId: string): boolean {
        const occupant = s.cardOccupants?.[cardId];
        return !!occupant && occupant !== this.myConnectionId;
    }

    // --- Template Helpers ---

    isInParticipantList(s: CloverMindedState): boolean {
        return !!s.participantIds?.includes(this.myConnectionId);
    }

    isSpectator(s: CloverMindedState): boolean {
        return !!s.currentSpectatorId && s.currentSpectatorId === this.myConnectionId;
    }

    phaseLabel(phase: string): string {
        switch (phase) {
            case CloverMindedPhase.ClueWriting: return 'Clue Writing';
            case CloverMindedPhase.Resolution: return 'Resolution (Attempt 1)';
            case CloverMindedPhase.ResolutionSecond: return 'Resolution (Attempt 2)';
            case CloverMindedPhase.BetweenRounds: return 'Between Boards';
            case CloverMindedPhase.GameOver: return 'Game Over';
            default: return phase;
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

    isSubmitted(s: CloverMindedState): boolean {
        return !!s.clueSubmitted?.[this.myConnectionId];
    }

    canSubmitClues(s: CloverMindedState): boolean {
        if (s.phase !== CloverMindedPhase.ClueWriting) return false;
        if (this.isSubmitted(s)) return false;
        const clues = this.draftClues.map(c => (c ?? '').trim());
        return clues.length === 4 && clues.every(c => c.length > 0);
    }

    submitCluesIfReady(s: CloverMindedState) {
        if (this.canSubmitClues(s)) this.submitClues(s);
    }

    submitClues(s: CloverMindedState) {
        if (!this.canSubmitClues(s)) return;
        this.isSubmitting = true;
        const clues = this.draftClues.map(c => (c ?? '').trim());
        this.signalRService.sendGameAction('CLOVER_SUBMIT_CLUES', { clues });
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
        this.isSubmitting = true;
        this.signalRService.sendGameAction('CLOVER_SUBMIT_GUESS', {});
    }
}
