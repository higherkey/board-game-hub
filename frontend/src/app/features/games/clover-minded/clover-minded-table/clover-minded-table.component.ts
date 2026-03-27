import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges, ViewChild, ElementRef, OnInit, OnDestroy } from '@angular/core';
import { Room, SignalRService } from '../../../../services/signalr.service';
import {
    CloverMindedPhase,
    CloverMindedState,
    CloverCardModel,
    CloverSlotState
} from '../clover-minded.types';
import { KeywordCard3dComponent } from '../components/keyword-card-3d/keyword-card-3d.component';
import { gsap } from 'gsap';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-clover-minded-table',
    standalone: true,
    imports: [CommonModule, KeywordCard3dComponent],
    templateUrl: './clover-minded-table.component.html',
    styleUrls: ['./clover-minded-table.component.scss']
})
export class CloverMindedTableComponent implements OnInit, OnChanges, OnDestroy {
    @Input() room!: Room;

    // The base game-room passes both Table/Hand roles, but this component is Table-only.
    @Input() myConnectionId: string = '';
    @Input() isHost = false;
    @Input() isScreen = true;

    @ViewChild('deckStack') deckStack?: ElementRef<HTMLDivElement>;
    @ViewChild('ghostLayer') ghostLayer?: ElementRef<HTMLDivElement>;
    @ViewChild('tetherLayer') tetherLayer?: ElementRef<SVGElement>;

    phases = CloverMindedPhase;
    hasDealtCards = false;
    activeDrags: Record<string, { connectionId: string, cardId: string, x: number, y: number }> = {};
    private signalRSubs: Subscription = new Subscription();

    // Symbols for accessible identification
    private symbols = ['★', '■', '♥', '▲', '●', '◈', '✦', '✽'];

    get state(): CloverMindedState | null {
        return (this.room?.gameData as CloverMindedState) ?? null;
    }

    get stateInResolution(): boolean {
        const p = this.state?.phase;
        return p === this.phases.Resolution || p === this.phases.ResolutionSecond;
    }

    constructor(private readonly signalRService: SignalRService) { }

    ngOnInit(): void {
        // Listen for transient drag moves
        this.signalRSubs.add(
            this.signalRService.cloverCardMoved$.subscribe(data => {
                if (data) {
                    this.updateDrag(data.connectionId, data.cardId, data.x, data.y);
                }
            })
        );
    }

    ngOnDestroy(): void {
        this.signalRSubs.unsubscribe();
        gsap.killTweensOf('.deck-stack');
        gsap.killTweensOf('.leaf-card app-keyword-card-3d');
        gsap.killTweensOf('.ghost-card');
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['room'] && this.state) {
            const s = this.state;
            
            // 1. Check for Dealing Sequence
            if (s.phase === this.phases.ClueWriting && !this.hasDealtCards && Object.keys(s.prepByPlayer || {}).length > 0) {
                this.runDealingAnimation();
            }

            // 2. Check for Snapping (FLIP) - Slot changes
            const prevRoom = changes['room'].previousValue as Room;
            const prevState = prevRoom?.gameData as CloverMindedState;
            if (prevState && s.slots) {
                this.checkForSnapping(prevState.slots || [], s.slots);
            }

            // 3. Clean up drags that are now placed or released
            this.cleanUpFinishedDrags(s);
        }
    }

    private updateDrag(connectionId: string, cardId: string, x: number, y: number) {
        this.activeDrags[connectionId] = { connectionId, cardId, x, y };

        // Animate the ghost card and tether immediately
        setTimeout(() => {
            const ghost = document.getElementById(`ghost-${connectionId}`);
            if (ghost) {
                gsap.to(ghost, {
                    left: `${x * 100}%`,
                    top: `${y * 100}%`,
                    duration: 0.1,
                    ease: 'power2.out'
                });
                this.updateTether(connectionId, x, y);
            }
        });
    }

    private updateTether(connectionId: string, x: number, y: number) {
        const bucket = document.getElementById(`bucket-${connectionId}`);
        const tether = document.getElementById(`tether-${connectionId}`) as unknown as SVGPathElement;
        const layer = this.tetherLayer?.nativeElement;
        if (!bucket || !tether || !layer) return;

        const rect = layer.getBoundingClientRect();
        const bRect = bucket.getBoundingClientRect();

        const startX = bRect.left + bRect.width / 2 - rect.left;
        const startY = bRect.top + bRect.height / 2 - rect.top;
        const endX = x * rect.width;
        const endY = y * rect.height;

        tether.setAttribute('d', `M${startX},${startY} L${endX},${endY}`);
    }

    private cleanUpFinishedDrags(s: CloverMindedState) {
        // If a card is now in a slot, or no longer in occupants, remove its drag
        const occupancy = s.cardOccupants || {};
        const connectionIds = Object.keys(this.activeDrags);
        
        for (const connId of connectionIds) {
            const drag = this.activeDrags[connId];
            const stillDragging = Object.values(occupancy).includes(connId);
            const isPlaced = s.slots?.some(sl => sl.cardId === drag.cardId);

            if (!stillDragging || isPlaced) {
                delete this.activeDrags[connId];
            }
        }
    }

    private runDealingAnimation() {
        this.hasDealtCards = true;
        const deck = this.deckStack?.nativeElement;
        if (!deck) return;

        const timeline = gsap.timeline();
        const s = this.state;
        if (!s) return;

        const pIds = s.participantIds;
        pIds.forEach((pId, i) => {
            const bucket = document.getElementById(`bucket-${pId}`);
            if (!bucket) return;

            // Create 4 temporary cards to fly from deck to bucket
            for (let j = 0; j < 4; j++) {
                const flyCard = document.createElement('div');
                flyCard.className = 'fly-card';
                flyCard.innerHTML = `<div style="width:40px;height:55px;background:white;border-radius:4px;box-shadow:0 4px 8px rgba(0,0,0,0.3)"></div>`;
                flyCard.style.position = 'absolute';
                flyCard.style.zIndex = '1000';
                document.body.appendChild(flyCard);

                const deckRect = deck.getBoundingClientRect();
                const buckRect = bucket.getBoundingClientRect();

                gsap.set(flyCard, {
                    left: deckRect.left,
                    top: deckRect.top,
                    rotation: Math.random() * 20 - 10
                });

                timeline.to(flyCard, {
                    left: buckRect.left + buckRect.width / 2,
                    top: buckRect.top + buckRect.height / 2,
                    rotation: 360 + Math.random() * 20,
                    scale: 0.5,
                    opacity: 0,
                    duration: 0.8,
                    ease: 'back.out(1.2)',
                    delay: (i * 0.2) + (j * 0.1),
                    onComplete: () => flyCard.remove()
                });
            }
        });
    }

    private checkForSnapping(prevSlots: CloverSlotState[], currentSlots: CloverSlotState[]) {
        currentSlots.forEach((slot, i) => {
            const prev = prevSlots[i];
            if (slot.cardId && (!prev || prev.cardId !== slot.cardId)) {
                // New card snapped into slot i!
                this.animateSlotSnap(i, slot.cardId);
            } else if (slot.cardId && prev && prev.rotation !== slot.rotation) {
                // Rotation changed
                this.animateSlotRotate(i);
            }
        });
    }

    private animateSlotSnap(slotIndex: number, cardId: string) {
        // FLIP: The card is already in the DOM at its final position. 
        // We find where it was (either in the pool or in a drag) and animate from there.
        setTimeout(() => {
            const slotEl = document.querySelector(`.leaf-${slotIndex} .leaf-card app-keyword-card-3d`);
            if (!slotEl) return;

            // Find source: was it in the pool?
            const poolEl = document.getElementById(`pool-card-${cardId}`);
            let startRect: DOMRect | null = null;
            if (poolEl) {
                startRect = poolEl.getBoundingClientRect();
            }

            if (startRect) {
                const endRect = slotEl.getBoundingClientRect();
                const deltaX = startRect.left - endRect.left;
                const deltaY = startRect.top - endRect.top;

                gsap.from(slotEl, {
                    x: deltaX,
                    y: deltaY,
                    duration: 0.5,
                    ease: 'power3.out'
                });
            }
        });
    }

    private animateSlotRotate(slotIndex: number) {
        const slotEl = document.querySelector(`.leaf-${slotIndex} .leaf-card app-keyword-card-3d`);
        if (!slotEl) return;
        gsap.from(slotEl, {
            rotation: '-=90',
            duration: 0.4,
            ease: 'back.out(2)'
        });
    }

    getCardById(cardId: string): CloverCardModel | null {
        const s = this.state;
        if (!s) return null;
        // Search pool
        let card = s.pool?.find(c => c.id === cardId);
        if (card) return card;
        // Search prep (for cards already placed)
        for (const p of Object.values(s.prepByPlayer || {})) {
            card = p.cards.find(c => c.id === cardId);
            if (card) return card;
        }
        return null;
    }

    getPlayerSymbol(connectionId: string): string {
        const idx = this.state?.participantIds.indexOf(connectionId) ?? 0;
        return this.symbols[idx % this.symbols.length];
    }

    getSlotCard(slotIndex: number): CloverCardModel | null {
        const s = this.state;
        if (!s?.slots || !s.pool) return null;
        const cardId = s.slots?.[slotIndex]?.cardId;
        if (!cardId) return null;

        return this.getCardById(cardId);
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
            case CloverMindedPhase.ClueWriting: return 'Clue Writing';
            case CloverMindedPhase.Resolution: return 'Resolution (Attempt 1)';
            case CloverMindedPhase.ResolutionSecond: return 'Resolution (Attempt 2)';
            case CloverMindedPhase.BetweenRounds: return 'Between Spectators';
            case CloverMindedPhase.GameOver: return 'Game Over';
            default: return phase;
        }
    }
}
