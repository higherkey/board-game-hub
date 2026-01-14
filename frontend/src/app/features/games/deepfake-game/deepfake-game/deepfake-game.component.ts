import { Component, ElementRef, Input, OnDestroy, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SignalRService, Room } from '../../../../services/signalr.service';
import { Subscription } from 'rxjs';
import { DeepfakeRulesComponent } from '../deepfake-rules/deepfake-rules.component';

interface DeepfakeState {
  prompt: string;
  category: string;
  aiConnectionId: string;
  strokes: DeepfakeStroke[];
  playerOrder: string[]; // ConnectionIds
  currentTurnIndex: number;
  totalRounds: number;
  phase: number; // 0=Drawing, 1=Voting, 2=Results
  votes: { [key: string]: string };
  aiCaught: boolean;
  aiWon: boolean;
}

interface DeepfakeStroke {
  ownerId: string;
  color: string;
  pathData: string;
}

@Component({
  selector: 'app-deepfake-game',
  standalone: true,
  imports: [CommonModule, FormsModule, DeepfakeRulesComponent],
  templateUrl: './deepfake-game.component.html',
  styleUrl: './deepfake-game.component.scss'
})
export class DeepfakeGameComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() room!: Room;

  // State helpers
  get state(): DeepfakeState { return this.room.gameData as DeepfakeState; }
  get myId(): string { return this.signalRService.getConnectionId() || ''; }
  get amIAi(): boolean { return this.state?.aiConnectionId === this.myId; }
  get isMyTurn(): boolean {
    if (!this.state?.playerOrder) return false;
    const turnPlayerId = this.state.playerOrder[this.state.currentTurnIndex % this.state.playerOrder.length];
    return turnPlayerId === this.myId;
  }

  get amIHost(): boolean {
    return this.room?.players?.find(p => p.connectionId === this.myId)?.isHost || false;
  }

  get turnPlayerName(): string {
    if (!this.state) return '';
    const id = this.state.playerOrder[this.state.currentTurnIndex % this.state.playerOrder.length];
    return this.getPlayerName(id);
  }

  get currentRound(): number {
    if (!this.state?.playerOrder || this.state.playerOrder.length === 0) return 1;
    return Math.floor(this.state.currentTurnIndex / this.state.playerOrder.length) + 1;
  }

  // Voting
  selectedVoteId: string = '';

  // AI Guess
  aiGuess: string = '';

  // History Playback
  playbackStrokes: DeepfakeStroke[] = [];
  playbackIndex: number = 0;
  private playbackInterval: any;

  // UI State
  showRules: boolean = false;

  // Canvas
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  private ctx!: CanvasRenderingContext2D;
  private isDrawing = false;
  private currentPath: { x: number, y: number }[] = [];

  private readonly subscriptions = new Subscription();

  constructor(private readonly signalRService: SignalRService) { }

  ngOnInit(): void {
    // Subscribe to room updates to redraw canvas when strokes change
    this.subscriptions.add(
      this.signalRService.currentRoom$.subscribe(updatedRoom => {
        if (updatedRoom) {
          const oldPhase = (this.room?.gameData as DeepfakeState)?.phase;
          const oldStrokesCount = (this.room?.gameData as DeepfakeState)?.strokes?.length || 0;
          this.room = updatedRoom;
          const newPhase = (this.room.gameData as DeepfakeState)?.phase;
          const newStrokesCount = (this.room.gameData as DeepfakeState)?.strokes?.length || 0;

          if (newPhase === 2 && oldPhase !== 2) {
            this.startHistoryPlayback();
          } else if (newStrokesCount !== oldStrokesCount && newPhase !== 2) {
            this.redrawCanvas();
          }
        }
      })
    );
  }

  ngAfterViewInit(): void {
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d')!;
    this.resizeCanvas();
    this.redrawCanvas();

    // Window Resize handling could be added here
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    if (this.playbackInterval) clearInterval(this.playbackInterval);
  }

  resizeCanvas() {
    const parent = this.canvasRef.nativeElement.parentElement;
    if (parent) {
      this.canvasRef.nativeElement.width = parent.clientWidth;
      this.canvasRef.nativeElement.height = 400; // Fixed height for now or dynamic
    }
  }

  // Canvas Events
  startDrawing(e: MouseEvent | TouchEvent) {
    if (!this.isMyTurn) return;
    this.isDrawing = true;
    this.currentPath = [];
    const pos = this.getPos(e);
    this.currentPath.push(pos);

    // Draw visual feedback immediately
    this.ctx.beginPath();
    this.ctx.moveTo(pos.x, pos.y);
  }

  draw(e: MouseEvent | TouchEvent) {
    if (!this.isDrawing) return;
    e.preventDefault();
    const pos = this.getPos(e);
    this.currentPath.push(pos);

    // Visual feedback
    this.ctx.lineTo(pos.x, pos.y);
    // Use player's color or standard black/blue?
    // Let's use a distinct color for "Local Drawing" before commit?
    // Or just commit to standard color.
    this.ctx.strokeStyle = '#000';
    this.ctx.lineWidth = 3;
    this.ctx.stroke();
  }

  endDrawing() {
    if (!this.isDrawing) return;
    this.isDrawing = false;

    // Convert path to SVG-like string or JSON
    // Format: "x,y;x,y;..."
    if (this.currentPath.length < 2) return; // Too short

    const pathData = CommonUtils.pointsToPath(this.currentPath, this.canvasRef.nativeElement.width, this.canvasRef.nativeElement.height);

    // Send to Server
    // Pick a color based on player index or hash
    const color = this.getPlayerColor(this.myId);
    this.signalRService.submitDeepfakeStroke(pathData, color);
  }

  private getPos(e: MouseEvent | TouchEvent): { x: number, y: number } {
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    const clientX = (e as TouchEvent).touches ? (e as TouchEvent).touches[0].clientX : (e as MouseEvent).clientX;
    const clientY = (e as TouchEvent).touches ? (e as TouchEvent).touches[0].clientY : (e as MouseEvent).clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  }

  private redrawCanvas() {
    if (!this.ctx) return;
    const width = this.canvasRef.nativeElement.width;
    const height = this.canvasRef.nativeElement.height;

    this.ctx.clearRect(0, 0, width, height);

    if (!this.state) return;

    // Which strokes to draw? Use state.strokes normally, or playbackStrokes in results phase
    const strokesToDraw = this.state.phase === 2 ? this.playbackStrokes : this.state.strokes;

    // Draw confirmed strokes
    strokesToDraw.forEach(stroke => {
      this.ctx.strokeStyle = stroke.color;
      this.ctx.lineWidth = 3;
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';

      const points = CommonUtils.pathToPoints(stroke.pathData, width, height);
      if (points.length > 0) {
        this.ctx.beginPath();
        this.ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
          this.ctx.lineTo(points[i].x, points[i].y);
        }
        this.ctx.stroke();
      }
    });
  }

  private startHistoryPlayback() {
    this.playbackStrokes = [];
    this.playbackIndex = 0;
    if (this.playbackInterval) clearInterval(this.playbackInterval);

    this.playbackInterval = setInterval(() => {
      if (this.playbackIndex < this.state.strokes.length) {
        this.playbackStrokes.push(this.state.strokes[this.playbackIndex]);
        this.playbackIndex++;
        this.redrawCanvas();
      } else {
        clearInterval(this.playbackInterval);
      }
    }, 1000); // 1 stroke per second
  }

  // Helpers
  getPlayerName(id: string): string {
    return this.room.players.find(p => p.connectionId === id)?.name || 'Unknown';
  }

  getPlayerColor(id: string): string {
    if (!id) return '#CCCCCC';
    // Generate consistent color from ID
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.codePointAt(i)! + ((hash << 5) - hash);
    }
    const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
    return '#' + '00000'.substring(0, 6 - c.length) + c;
  }

  submitVote() {
    if (this.selectedVoteId) {
      this.signalRService.submitDeepfakeVote(this.selectedVoteId);
    }
  }

  submitAiGuess() {
    if (this.aiGuess) {
      this.signalRService.submitDeepfakeAiGuess(this.aiGuess);
    }
  }

  handleNextRound() {
    this.signalRService.nextRound();
  }

  // Voting Status
  hasVoted(playerId: string): boolean {
    return !!this.state.votes[playerId];
  }
}

// Utility for normalized coordinates (0-1) so strokes scale
class CommonUtils {
  static pointsToPath(points: { x: number, y: number }[], width: number, height: number): string {
    return points.map(p => `${(p.x / width).toFixed(4)},${(p.y / height).toFixed(4)}`).join(';');
  }

  static pathToPoints(pathData: string, width: number, height: number): { x: number, y: number }[] {
    if (!pathData) return [];
    return pathData.split(';').map(pair => {
      const [x, y] = pair.split(',').map(Number);
      return { x: x * width, y: y * height };
    });
  }
}
