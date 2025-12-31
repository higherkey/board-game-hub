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
  friends: any[] = [];
  newMessage = '';
  friendUserId = '';
  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly socialService: SocialService,
    private readonly authService: AuthService
  ) { }

  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      this.socialService.startConnection().then(() => {
        this.socialService.messages$
          .pipe(takeUntil(this.destroy$))
          .subscribe(messages => this.messages = messages);

        this.socialService.friendRequests$
          .pipe(takeUntil(this.destroy$))
          .subscribe(requests => this.friendRequests = requests);

        this.socialService.friends$
          .pipe(takeUntil(this.destroy$))
          .subscribe(friends => this.friends = friends);
      });
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
    this.friendRequests = this.friendRequests.filter(r => r.requesterId !== requesterId);
  }

  async removeFriend(friendId: string) {
    if (confirm('Are you sure you want to remove this friend?')) {
      await this.socialService.removeFriend(friendId);
    }
  }
}
