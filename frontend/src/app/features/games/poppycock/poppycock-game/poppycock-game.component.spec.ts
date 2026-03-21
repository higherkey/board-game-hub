import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PoppycockGameComponent } from './poppycock-game.component';
import { SignalRService } from '../../../../services/signalr.service';
import { MockSignalRService } from '../../../../testing/mock-signalr.service';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-poppycock-board',
  standalone: true,
  template: ''
})
class MockBoardComponent {
  @Input() room: any;
}

@Component({
  selector: 'app-poppycock-player',
  standalone: true,
  template: ''
})
class MockPlayerComponent {
  @Input() room: any;
}

@Component({
  selector: 'app-poppycock-rules',
  standalone: true,
  template: ''
})
class MockRulesComponent {}

describe('PoppycockGameComponent', () => {
  let component: PoppycockGameComponent;
  let fixture: ComponentFixture<PoppycockGameComponent>;
  let mockSignalRService: MockSignalRService;

  beforeEach(async () => {
    mockSignalRService = new MockSignalRService();

    await TestBed.configureTestingModule({
      imports: [PoppycockGameComponent],
      providers: [
        { provide: SignalRService, useValue: mockSignalRService }
      ]
    })
    .overrideComponent(PoppycockGameComponent, {
      remove: { imports: [any] }, // This doesn't work well with standalone
      // Better to just let it import and not worry too much if they are simple,
      // or use the 'declarations' trick if they weren't standalone.
      // Since they ARE standalone, we can't easily swap them in 'imports' via configureTestingModule.
      // But we can use 'overrideComponent'.
    })
    .compileComponents();

    fixture = TestBed.createComponent(PoppycockGameComponent);
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

  it('should not show rules if not round 1', () => {
    component.showRules = false;
    component.room.roundNumber = 2;
    component.ngOnInit();
    expect(component.showRules).toBeFalse();
  });

  it('should call submitPoppycockDefinition on SignalRService', () => {
    const def = 'A funny word';
    component.onDefinitionSubmitted(def);
    expect(mockSignalRService.submitPoppycockDefinition).toHaveBeenCalledWith(def);
  });

  it('should call submitPoppycockVote on SignalRService', () => {
    const voteId = 'conn123';
    component.onVoteSubmitted(voteId);
    expect(mockSignalRService.submitPoppycockVote).toHaveBeenCalledWith(voteId);
  });
});
