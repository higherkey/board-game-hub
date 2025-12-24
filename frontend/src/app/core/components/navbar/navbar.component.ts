import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { Observable } from 'rxjs';
import { ActiveGamesComponent } from '../../../features/active-games/active-games.component';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, ActiveGamesComponent],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent {
  currentUser$: Observable<any>;
  isCollapsed = true;
  isDropdownOpen = false;

  constructor(private readonly authService: AuthService, private readonly router: Router) {
    this.currentUser$ = this.authService.currentUser$;
  }

  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  logout() {
    this.authService.logout();
    this.isCollapsed = true;
    this.isDropdownOpen = false;
  }
}
