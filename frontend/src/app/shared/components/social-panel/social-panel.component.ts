import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SocialService, ChatMessage, FriendRequest } from '../../../services/social.service';
import { AuthService } from '../../../services/auth.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-social-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './social-panel.component.html',
  styleUrl: './social-panel.component.scss'
})
export class SocialPanelComponent implements OnInit, OnDestroy {
  messages: ChatMessage[] = [];
  friendRequests: FriendRequest[] = [];
  newMessage = '';
  friendUserId = '';
  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly socialService: SocialService,
    private readonly authService: AuthService
  ) { }

  async ngOnInit() {
    if (this.authService.isAuthenticated()) {
      await this.socialService.startConnection();

      this.socialService.messages$
        .pipe(takeUntil(this.destroy$))
        .subscribe(messages => this.messages = messages);

      this.socialService.friendRequests$
        .pipe(takeUntil(this.destroy$))
        .subscribe(requests => this.friendRequests = requests);
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.socialService.stopConnection();
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
