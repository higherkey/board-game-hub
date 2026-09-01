import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type SoundEffect = 'click' | 'tick' | 'urgentTick' | 'buzzer' | 'cardSnap' | 'victory';

@Injectable({
  providedIn: 'root'
})
export class SoundService {
  private static readonly STORAGE_KEY_MUTED = 'bgh_sound_muted';
  private static readonly STORAGE_KEY_VOLUME = 'bgh_sound_volume';

  private audioCtx: AudioContext | null = null;
  private readonly isMutedSubject: BehaviorSubject<boolean>;
  private readonly volumeSubject: BehaviorSubject<number>;

  public readonly isMuted$: Observable<boolean>;
  public readonly volume$: Observable<number>;

  constructor() {
    const savedMuted = localStorage.getItem(SoundService.STORAGE_KEY_MUTED);
    const initialMuted = savedMuted === 'true';

    const savedVolume = localStorage.getItem(SoundService.STORAGE_KEY_VOLUME);
    const initialVolume = savedVolume ? Math.max(0, Math.min(1, parseFloat(savedVolume))) : 0.5;

    this.isMutedSubject = new BehaviorSubject<boolean>(initialMuted);
    this.volumeSubject = new BehaviorSubject<number>(initialVolume);

    this.isMuted$ = this.isMutedSubject.asObservable();
    this.volume$ = this.volumeSubject.asObservable();
  }

  public get isMuted(): boolean {
    return this.isMutedSubject.value;
  }

  public get volume(): number {
    return this.volumeSubject.value;
  }

  public toggleMute(): boolean {
    const newState = !this.isMuted;
    this.setMuted(newState);
    return newState;
  }

  public setMuted(muted: boolean): void {
    this.isMutedSubject.next(muted);
    try {
      localStorage.setItem(SoundService.STORAGE_KEY_MUTED, String(muted));
    } catch {
      // localStorage may be restricted
    }
  }

  public setVolume(vol: number): void {
    const clamped = Math.max(0, Math.min(1, vol));
    this.volumeSubject.next(clamped);
    try {
      localStorage.setItem(SoundService.STORAGE_KEY_VOLUME, String(clamped));
    } catch {
      // localStorage may be restricted
    }
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;

    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }

    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }

    return this.audioCtx;
  }

  public play(effect: SoundEffect): void {
    if (this.isMuted || this.volume <= 0) return;

    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      switch (effect) {
        case 'click':
          this.synthClick(ctx);
          break;
        case 'tick':
          this.synthTick(ctx, 800, 0.03);
          break;
        case 'urgentTick':
          this.synthTick(ctx, 1200, 0.05);
          break;
        case 'buzzer':
          this.synthBuzzer(ctx);
          break;
        case 'cardSnap':
          this.synthCardSnap(ctx);
          break;
        case 'victory':
          this.synthVictory(ctx);
          break;
      }
    } catch (err) {
      // Graceful degradation if audio generation fails
    }
  }

  public playClick(): void {
    this.play('click');
  }

  public playTick(urgent = false): void {
    this.play(urgent ? 'urgentTick' : 'tick');
  }

  public playBuzzer(): void {
    this.play('buzzer');
  }

  public playCardSnap(): void {
    this.play('cardSnap');
  }

  public playVictory(): void {
    this.play('victory');
  }

  private synthClick(ctx: AudioContext): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const masterVol = this.volume;

    const now = ctx.currentTime;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1000, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.04);

    gain.gain.setValueAtTime(0.3 * masterVol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.04);
  }

  private synthTick(ctx: AudioContext, freq: number, duration: number): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const masterVol = this.volume;

    const now = ctx.currentTime;
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.4 * masterVol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration);
  }

  private synthBuzzer(ctx: AudioContext): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const masterVol = this.volume;

    const now = ctx.currentTime;
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.setValueAtTime(130, now + 0.1);

    gain.gain.setValueAtTime(0.4 * masterVol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.25);
  }

  private synthCardSnap(ctx: AudioContext): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const masterVol = this.volume;

    const now = ctx.currentTime;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.06);

    gain.gain.setValueAtTime(0.5 * masterVol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.06);
  }

  private synthVictory(ctx: AudioContext): void {
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 arpeggio
    const noteDuration = 0.12;
    const masterVol = this.volume;

    notes.forEach((freq, index) => {
      const now = ctx.currentTime + (index * noteDuration);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      const isLast = index === notes.length - 1;
      const duration = isLast ? 0.4 : noteDuration;

      gain.gain.setValueAtTime(0.35 * masterVol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + duration);
    });
  }
}
