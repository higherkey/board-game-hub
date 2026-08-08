import { Component, EventEmitter, Input, Output, OnInit, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../../../shared/services/toast.service';
import { RouterModule } from '@angular/router';

import { DeviceService } from '../../../../services/device.service';

@Component({
  selector: 'app-room-entry',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './room-entry.component.html',
  styleUrls: ['./room-entry.component.scss']
})
export class RoomEntryComponent implements OnInit {
  @Input() isCreating = false;
  @Input() isGuest = true;
  @Input() initialName = '';
  
  @Output() submitEntry = new EventEmitter<{ name: string, joinType: 'player' | 'table', isPublic: boolean }>();
  @Output() login = new EventEmitter<void>();

  @ViewChild('playerNameInput') playerNameInput!: ElementRef<HTMLInputElement>;

  private readonly toastService = inject(ToastService);
  private readonly deviceService = inject(DeviceService);

  promptPlayerName = '';
  joinType: 'player' | 'table' | null = null;
  isPublic = true;
  showNameError = false;

  ngOnInit() {
    this.promptPlayerName = this.initialName;
    if (!this.joinType) {
      this.joinType = this.deviceService.isMobileValue ? 'player' : 'table';
    }
  }

  onSubmit() {
    if (!this.promptPlayerName?.trim()) {
      this.showNameError = true;
      this.toastService.showError('Please enter a display name to continue.');
      setTimeout(() => {
        this.playerNameInput?.nativeElement.focus();
      });
      return;
    }

    if (!this.joinType) {
      this.toastService.showError('Please select whether you are joining as a Player or a Table.');
      return;
    }

    this.showNameError = false;
    this.submitEntry.emit({ 
      name: this.promptPlayerName.trim(), 
      joinType: this.joinType, 
      isPublic: this.isPublic 
    });
  }

  goToLogin() {
    this.login.emit();
  }
}
