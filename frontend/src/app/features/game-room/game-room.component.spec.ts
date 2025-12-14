import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GameRoomComponent } from './game-room.component';
import { SignalRService } from '../../services/signalr.service';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { Component, Input, Output, EventEmitter } from '@angular/core';

// Stub Components
@Component({ selector: 'app-game-board', template: '', standalone: true, imports: [] })
class GameBoardStubComponent {
  @Input() roomCode: any;
  @Input() isHost: any;
}

@Component({ selector: 'app-mobile-controller', template: '', standalone: true, imports: [] })
class MobileControllerStubComponent {
  @Input() roomCode: any;
}

@Component({ selector: 'app-host-settings', template: '', standalone: true, imports: [] })
class HostSettingsStubComponent {
  @Input() roomCode: any;
  @Input() currentGameType: any;
  @Output() gameStart = new EventEmitter<any>();
}

@Component({ selector: 'app-video-chat', template: '', standalone: true, imports: [] })
class VideoChatStubComponent { }

@Component({ selector: 'app-word-hunt', template: '', standalone: true, imports: [] })
class BabbleStubComponent {
  @Input() grid: any;
  @Input() isPlaying: any;
  @Output() wordsUpdated = new EventEmitter<any>();
}

@Component({ selector: 'app-game-review', template: '', standalone: true, imports: [] })
class GameReviewStubComponent {
  @Input() room: any;
  @Input() isHost: any;
}

@Component({ selector: 'app-social-panel', template: '', standalone: true, imports: [] })
class SocialPanelStubComponent { }

@Component({ selector: 'app-one-and-only-board', template: '', standalone: true, imports: [] })
class OneAndOnlyBoardStubComponent {
  @Input() room: any;
}

@Component({ selector: 'app-one-and-only-player', template: '', standalone: true, imports: [] })
class OneAndOnlyPlayerStubComponent {
  @Input() room: any;
  @Input() myConnectionId: any;
  @Output() clueSubmitted = new EventEmitter<any>();
  @Output() guessSubmitted = new EventEmitter<any>();
}

// Import real components to override
import { GameBoardComponent } from '../game-board/game-board.component';
import { MobileControllerComponent } from '../mobile-controller/mobile-controller.component';
import { HostSettingsComponent } from './components/host-settings/host-settings.component';
import { VideoChatComponent } from './components/video-chat/video-chat.component';
import { BabbleComponent } from '../games/babble/babble.component';
import { GameReviewComponent } from './components/game-review/game-review.component';
import { SocialPanelComponent } from '../../shared/components/social-panel/social-panel.component';
import { OneAndOnlyBoardComponent } from '../games/one-and-only/one-and-only-board.component';
import { OneAndOnlyPlayerComponent } from '../games/one-and-only/one-and-only-player.component';

describe('GameRoomComponent', () => {
  let component: GameRoomComponent;
  let fixture: ComponentFixture<GameRoomComponent>;
  let mockSignalRService: any;
  let mockActivatedRoute: any;

  const playersSubject = new BehaviorSubject<any[]>([]);
  const roomSubject = new BehaviorSubject<any>(null);
  const connectionSubject = new BehaviorSubject<string>('Connected');

  beforeEach(async () => {
    mockSignalRService = {
      players$: playersSubject.asObservable(),
      currentRoom$: roomSubject.asObservable(),
      connectionStatus$: connectionSubject.asObservable(),
      startConnection: jasmine.createSpy('startConnection').and.returnValue(Promise.resolve()),
      joinRoom: jasmine.createSpy('joinRoom').and.returnValue(Promise.resolve(true)),
      startGame: jasmine.createSpy('startGame')
    };

    mockActivatedRoute = {
      snapshot: {
        paramMap: convertToParamMap({ code: 'ABCD' }),
        queryParamMap: convertToParamMap({ name: 'TestUser' })
      }
    };

    await TestBed.configureTestingModule({
      imports: [GameRoomComponent],
      providers: [
        provideRouter([]),
        { provide: SignalRService, useValue: mockSignalRService },
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
      ]
    })
      .overrideComponent(GameRoomComponent, {
        remove: {
          imports: [
            GameBoardComponent,
            MobileControllerComponent,
            HostSettingsComponent,
            VideoChatComponent,
            BabbleComponent,
            GameReviewComponent,
            SocialPanelComponent,
            OneAndOnlyBoardComponent,
            OneAndOnlyPlayerComponent
          ]
        },
        add: {
          imports: [
            GameBoardStubComponent,
            MobileControllerStubComponent,
            HostSettingsStubComponent,
            VideoChatStubComponent,
            BabbleStubComponent,
            GameReviewStubComponent,
            SocialPanelStubComponent,
            OneAndOnlyBoardStubComponent,
            OneAndOnlyPlayerStubComponent
          ]
        }
      })
      .compileComponents();

    fixture = TestBed.createComponent(GameRoomComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize and join room', () => {
    expect(component.roomCode).toBe('ABCD');
    expect(mockSignalRService.startConnection).toHaveBeenCalled();
    expect(mockSignalRService.joinRoom).toHaveBeenCalledWith('ABCD', 'TestUser');
  });

  it('should identify host correctly', (done) => {
    const players = [
      { name: 'Other', isHost: false },
      { name: 'TestUser', isHost: true }
    ];
    playersSubject.next(players);

    component.isHost$.subscribe(isHost => {
      expect(isHost).toBeTrue();
      done();
    });
  });

  it('startGame should call service', () => {
    const settings: any = { timerDurationSeconds: 60 };
    component.startGame(settings);
    expect(mockSignalRService.startGame).toHaveBeenCalledWith(settings);
  });
});
