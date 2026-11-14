import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SocialService, ChatMessage, FriendRequest } from '../../../services/social.service';
import { AuthService } from '../../../services/auth.service';
import { Subject, takeUntil } from 'rxjs';
import { LoggerService } from '../../../core/services/logger.service';

@Component({
  selector: 'app-social-sidebar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './social-sidebar.component.html',
  styleUrls: ['./social-sidebar.component.scss']
})
export class SocialSidebarComponent implements OnInit, OnDestroy {
  isCollapsed = false;
  messages: ChatMessage[] = [];
  friendRequests: FriendRequest[] = [];
  newMessage = '';
  friendUserId = '';
  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly socialService: SocialService,
    private readonly authService: AuthService,
    private readonly logger: LoggerService
  ) { }

  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      this.socialService.messages$
        .pipe(takeUntil(this.destroy$))
        .subscribe(messages => this.messages = messages);

      this.socialService.friendRequests$
        .pipe(takeUntil(this.destroy$))
        .subscribe(requests => this.friendRequests = requests);

      this.socialService.startConnection().catch(err => this.logger.error('Failed to connect social sidebar', err));
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.socialService.stopConnection().catch(err => this.logger.error('Failed to disconnect social sidebar', err));
  }

  toggleSidebar() {
    this.isCollapsed = !this.isCollapsed;
  }

  async sendMessage() {
    if (this.newMessage.trim()) {
      await this.socialService.sendGlobalMessage(this.newMessage);
      this.newMessage = '';
    }
  }

  async addFriend() {
    if (this.friendUserId.trim()) {
      await this.socialService.sendFriendRequest(this.friendUserId);
      this.friendUserId = '';
    }
  }

  async acceptRequest(requesterId: string) {
    await this.socialService.acceptFriendRequest(requesterId);
    this.friendRequests = this.friendRequests.filter(r => r.senderId !== requesterId);
  }
}
