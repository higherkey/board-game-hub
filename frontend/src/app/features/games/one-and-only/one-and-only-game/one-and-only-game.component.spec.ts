import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OneAndOnlyGameComponent } from './one-and-only-game.component';
import { SignalRService } from '../../../../services/signalr.service';
import { MockSignalRService } from '../../../../testing/mock-signalr.service';
import { Component, Input } from '@angular/core';

describe('OneAndOnlyGameComponent', () => {
  let component: OneAndOnlyGameComponent;
  let fixture: ComponentFixture<OneAndOnlyGameComponent>;
  let mockSignalRService: MockSignalRService;

  beforeEach(async () => {
    mockSignalRService = new MockSignalRService();

    await TestBed.configureTestingModule({
      imports: [OneAndOnlyGameComponent],
      providers: [
        { provide: SignalRService, useValue: mockSignalRService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(OneAndOnlyGameComponent);
    component = fixture.componentInstance;
    component.room = {
      code: 'TEST',
      roundNumber: 1,
      gameData: null,
      players: []
    } as any;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show rules on first round with no data', () => {
    component.room.roundNumber = 1;
    component.room.gameData = null;
    component.ngOnInit();
    expect(component.showRules).toBeTrue();
  });

  it('should call submitClue on SignalRService', () => {
    const clue = 'Wait';
    component.onClueSubmitted(clue);
    expect(mockSignalRService.submitClue).toHaveBeenCalledWith(clue);
  });

  it('should call submitGuess on SignalRService', () => {
    const guess = { guess: 'Apple', isPass: false };
    component.onGuessSubmitted(guess);
    expect(mockSignalRService.submitGuess).toHaveBeenCalledWith(guess.guess, guess.isPass);
  });
});
