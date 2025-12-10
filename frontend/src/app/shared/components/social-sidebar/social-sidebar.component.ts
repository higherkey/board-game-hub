import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SocialService, ChatMessage, FriendRequest } from '../../../services/social.service';
import { AuthService } from '../../../services/auth.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
    selector: 'app-social-sidebar',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="social-sidebar" [class.collapsed]="isCollapsed">
      <button class="toggle-btn" (click)="toggleSidebar()">
        {{ isCollapsed ? '◀' : '▶' }}
      </button>
      
      <div class="sidebar-content" *ngIf="!isCollapsed">
        <h3>Social</h3>
        
        <!-- Friend Requests -->
        <div class="section" *ngIf="friendRequests.length > 0">
          <h4>Friend Requests</h4>
          <div *ngFor="let request of friendRequests" class="friend-request">
            <span>{{ request.senderId }}</span>
            <button class="btn btn-sm btn-success" (click)="acceptRequest(request.senderId)">Accept</button>
          </div>
        </div>

        <!-- Chat -->
        <div class="section">
          <h4>Global Chat</h4>
          <div class="messages">
            <div *ngFor="let msg of messages" class="message">
              <strong>{{ msg.senderId }}:</strong>
              <span>{{ msg.message }}</span>
            </div>
          </div>
          
          <div class="message-input">
            <input 
              type="text" 
              [(ngModel)]="newMessage" 
              (keyup.enter)="sendMessage()"
              placeholder="Type a message..."
              class="form-control form-control-sm"
            />
            <button class="btn btn-primary btn-sm" (click)="sendMessage()">Send</button>
          </div>
        </div>

        <!-- Add Friend -->
        <div class="section">
          <h4>Add Friend</h4>
          <input 
            type="text" 
            [(ngModel)]="friendUserId" 
            placeholder="User ID"
            class="form-control form-control-sm mb-2"
          />
          <button class="btn btn-primary btn-sm w-100" (click)="addFriend()">Send Request</button>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .social-sidebar {
      position: fixed;
      right: 0;
      top: 60px;
      width: 300px;
      height: calc(100vh - 60px);
      background: rgba(26, 26, 46, 0.95);
      backdrop-filter: blur(10px);
      border-left: 2px solid #e91e63;
      transition: transform 0.3s ease;
      z-index: 1000;
      overflow-y: auto;
    }

    .social-sidebar.collapsed {
      transform: translateX(260px);
    }

    .toggle-btn {
      position: absolute;
      left: -40px;
      top: 20px;
      width: 40px;
      height: 40px;
      background: #e91e63;
      border: none;
      color: white;
      cursor: pointer;
      border-radius: 5px 0 0 5px;
      font-size: 20px;
    }

    .sidebar-content {
      padding: 20px;
      color: white;
    }

    .section {
      margin-bottom: 20px;
      padding-bottom: 20px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    h3 {
      margin-bottom: 20px;
      color: #e91e63;
    }

    h4 {
      font-size: 14px;
      margin-bottom: 10px;
      color: #ff4081;
    }

    .messages {
      max-height: 200px;
      overflow-y: auto;
      margin-bottom: 10px;
      padding: 10px;
      background: rgba(0, 0, 0, 0.3);
      border-radius: 5px;
    }

    .message {
      margin-bottom: 8px;
      font-size: 12px;
    }

    .message strong {
      color: #e91e63;
    }

    .message-input {
      display: flex;
      gap: 5px;
    }

    .friend-request {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px;
      background: rgba(0, 0, 0, 0.3);
      border-radius: 5px;
      margin-bottom: 8px;
      font-size: 12px;
    }
  `]
})
export class SocialSidebarComponent implements OnInit, OnDestroy {
    isCollapsed = false;
    messages: ChatMessage[] = [];
    friendRequests: FriendRequest[] = [];
    newMessage = '';
    friendUserId = '';
    private destroy$ = new Subject<void>();

    constructor(
        private socialService: SocialService,
        private authService: AuthService
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
