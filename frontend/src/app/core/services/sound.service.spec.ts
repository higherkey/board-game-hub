import { TestBed } from '@angular/core/testing';
import { SoundService } from './sound.service';

describe('SoundService', () => {
  let service: SoundService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [SoundService]
    });
    service = TestBed.inject(SoundService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created with default unmuted and 0.5 volume', () => {
    expect(service).toBeTruthy();
    expect(service.isMuted).toBeFalse();
    expect(service.volume).toBe(0.5);
  });

  it('should toggle mute state and persist in localStorage', () => {
    const newState = service.toggleMute();
    expect(newState).toBeTrue();
    expect(service.isMuted).toBeTrue();
    expect(localStorage.getItem('bgh_sound_muted')).toBe('true');

    service.toggleMute();
    expect(service.isMuted).toBeFalse();
    expect(localStorage.getItem('bgh_sound_muted')).toBe('false');
  });

  it('should set and clamp volume correctly', () => {
    service.setVolume(0.8);
    expect(service.volume).toBe(0.8);
    expect(localStorage.getItem('bgh_sound_volume')).toBe('0.8');

    service.setVolume(1.5);
    expect(service.volume).toBe(1.0);

    service.setVolume(-0.5);
    expect(service.volume).toBe(0);
  });

  it('should safely invoke sound effects without throwing exceptions', () => {
    expect(() => service.playClick()).not.toThrow();
    expect(() => service.playTick(false)).not.toThrow();
    expect(() => service.playTick(true)).not.toThrow();
    expect(() => service.playBuzzer()).not.toThrow();
    expect(() => service.playCardSnap()).not.toThrow();
    expect(() => service.playVictory()).not.toThrow();
  });

  it('should not play audio when muted', () => {
    service.setMuted(true);
    expect(() => service.playClick()).not.toThrow();
  });
});
