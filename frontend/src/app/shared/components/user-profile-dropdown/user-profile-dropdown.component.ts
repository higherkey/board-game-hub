import { Component, Input, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
    selector: 'app-user-profile-dropdown',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './user-profile-dropdown.component.html',
    styleUrls: ['./user-profile-dropdown.component.scss']
})
export class UserProfileDropdownComponent {
    @Input() session: any;
    @Input() compactMode: boolean = false;
    @Input() menuAlign: 'start' | 'end' = 'end';

    private readonly authService = inject(AuthService);
    isDropdownOpen = false;

    toggleDropdown(event: Event) {
        event.stopPropagation();
        this.isDropdownOpen = !this.isDropdownOpen;
    }

    @HostListener('document:click')
    onDocumentClick() {
        this.isDropdownOpen = false;
    }

    logout() {
        this.authService.logout();
        this.isDropdownOpen = false;
    }
}
