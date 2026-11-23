import { Component, EventEmitter, Input, Output, ViewChild, ElementRef, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { UserProfileDropdownComponent } from '../../../../shared/components/user-profile-dropdown/user-profile-dropdown.component';
import { DeviceService } from '../../../../services/device.service';
import { SoundService } from '../../../../core/services/sound.service';

@Component({
  selector: 'app-room-header',
  standalone: true,
  imports: [CommonModule, RouterModule, UserProfileDropdownComponent],
  templateUrl: './room-header.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./room-header.component.scss']
})
export class RoomHeaderComponent {
  readonly deviceService = inject(DeviceService);
  readonly soundService = inject(SoundService);
  @ViewChild('navMenuDialog') navMenuDialog?: ElementRef<HTMLDialogElement>;
  @ViewChild('menuTrigger') menuTrigger?: ElementRef<HTMLButtonElement>;

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
    const dialog = this.navMenuDialog?.nativeElement;
    if (dialog) {
      if (this.isNavMenuOpen && !dialog.open) {
        dialog.showModal();
      } else if (!this.isNavMenuOpen && dialog.open) {
        dialog.close();
      }
    }
  }

  onDialogClose() {
    this.isNavMenuOpen = false;
    this.menuTrigger?.nativeElement?.focus();
  }

  onDialogKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape' && this.isNavMenuOpen) {
      event.preventDefault();
      this.toggleNavMenu();
    }
  }

  onContentKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.toggleNavMenu();
    } else {
      event.stopPropagation();
    }
  }

  toggleSound() {
    this.soundService.toggleMute();
    this.soundService.playClick();
  }
}

