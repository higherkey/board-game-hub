import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WisecrackGameComponent } from './wisecrack-game.component';
import { SignalRService } from '../../../../services/signalr.service';
import { createMockRoom } from '../../../../shared/testing/test-helpers';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { WisecrackBoardComponent } from '../wisecrack-board/wisecrack-board.component';
import { WisecrackPlayerComponent } from '../wisecrack-player/wisecrack-player.component';
import { WisecrackRulesComponent } from '../wisecrack-rules/wisecrack-rules.component';

// Stub child components
@Component({ selector: 'app-wisecrack-board', template: '', standalone: true, imports: [] })
class WisecrackBoardStubComponent {
    @Input() room: any;
    @Input() myConnectionId: any;
    @Input() isHost: any;
}

@Component({ selector: 'app-wisecrack-player', template: '', standalone: true, imports: [] })
class WisecrackPlayerStubComponent {
    @Input() room: any;
    @Input() myConnectionId: any;
    @Input() playerId: any;
}

@Component({ selector: 'app-wisecrack-rules', template: '', standalone: true, imports: [] })
class WisecrackRulesStubComponent { }

describe('WisecrackGameComponent', () => {
    let component: WisecrackGameComponent;
    let fixture: ComponentFixture<WisecrackGameComponent>;
    let mockSignalRService: any;

    beforeEach(async () => {
        mockSignalRService = {
            // Add methods if needed by GameComponent (e.g. startGame)
        };

        await TestBed.configureTestingModule({
            imports: [WisecrackGameComponent, FormsModule, CommonModule],
            providers: [
                { provide: SignalRService, useValue: mockSignalRService }
            ]
        })
            .overrideComponent(WisecrackGameComponent, {
                remove: { imports: [WisecrackBoardComponent, WisecrackPlayerComponent, WisecrackRulesComponent] },
                add: { imports: [WisecrackBoardStubComponent, WisecrackPlayerStubComponent, WisecrackRulesStubComponent] }
            })
            .compileComponents();

        fixture = TestBed.createComponent(WisecrackGameComponent);
        component = fixture.componentInstance;

        // Mock Inputs
        component.room = createMockRoom({
            gameType: 'Wisecrack',
            gameData: { phase: 'WRITING' }
        });

        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
