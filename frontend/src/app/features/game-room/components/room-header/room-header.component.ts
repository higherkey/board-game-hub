import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { UserProfileDropdownComponent } from '../../../../shared/components/user-profile-dropdown/user-profile-dropdown.component';
import { DeviceService } from '../../../../services/device.service';

@Component({
  selector: 'app-room-header',
  standalone: true,
  imports: [CommonModule, RouterModule, UserProfileDropdownComponent],
  templateUrl: './room-header.component.html',
  styleUrls: ['./room-header.component.scss']
})
export class RoomHeaderComponent {
  readonly deviceService = inject(DeviceService);
  @Input() isBigScreen = false;
  @Input() roomCode = '';
  @Input() gameDisplayName = 'Lobby';
  @Input() isLobby = true;
  @Input() videoChatReady = false;
  @Input() isVideoActive = false;
  @Input() gameStarted = false;
  @Input() currentRound = 1;
  @Input() totalRounds = 5;
  @Input() session: any = null;
  @Input() showUndoButton = false;
  
  @Output() leaveRoom = new EventEmitter<void>();
  @Output() startVideoChat = new EventEmitter<void>();
  @Output() requestUndo = new EventEmitter<void>();

  isNavMenuOpen = false;

  toggleNavMenu() {
    this.isNavMenuOpen = !this.isNavMenuOpen;
  }
}
