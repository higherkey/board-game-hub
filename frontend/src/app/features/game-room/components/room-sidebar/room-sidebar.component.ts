import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Player, Room } from '../../../../services/signalr.service';

@Component({
  selector: 'app-room-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './room-sidebar.component.html',
  styleUrls: ['./room-sidebar.component.scss']
})
export class RoomSidebarComponent {
  @Input() currentRoom: Room | null | undefined = null;
  @Input() players: Player[] = [];
  @Input() tables: Player[] = [];
  @Input() connectionId = '';

  @Output() toggleSidebar = new EventEmitter<void>();
  @Output() setHostPlayer = new EventEmitter<string>();
  @Output() removeHostPlayer = new EventEmitter<string>();
  @Output() changeRole = new EventEmitter<boolean>();

  checkIsCreator(room: Room | null | undefined, playerConnectionId: string | null | undefined): boolean {
    if (!room || !playerConnectionId) return false;
    return room.creatorConnectionId === playerConnectionId;
  }
}
