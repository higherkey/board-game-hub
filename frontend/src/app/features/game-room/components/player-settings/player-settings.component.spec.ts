import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PlayerSettingsComponent } from './player-settings.component';
import { CommonModule } from '@angular/common';

describe('PlayerSettingsComponent', () => {
    let component: PlayerSettingsComponent;
    let fixture: ComponentFixture<PlayerSettingsComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [PlayerSettingsComponent, CommonModule]
        }).compileComponents();

        fixture = TestBed.createComponent(PlayerSettingsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should emit toggleReady when onToggleReady is called', () => {
        spyOn(component.toggleReady, 'emit');
        component.onToggleReady();
        expect(component.toggleReady.emit).toHaveBeenCalled();
    });

    it('should generate correct QR code URL', () => {
        component.roomCode = 'TEST';
        const expectedUrlPart = encodeURIComponent(globalThis.location.origin + '/game/TEST');
        const qrUrl = component.getQrCodeUrl();
        expect(qrUrl).toContain('api.qrserver.com');
        expect(qrUrl).toContain(expectedUrlPart);
    });

    it('should return settings from room', () => {
        const mockRoom = {
            code: 'TEST',
            settings: {
                gameType: 'Coup',
                parameters: { maxPlayers: 6 }
            }
        } as any;
        component.room = mockRoom;
        expect(component.settings).toEqual(mockRoom.settings);
    });
});
