import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService, Session } from '../../../services/auth.service';
import { Observable } from 'rxjs';
import { ActiveGamesComponent } from '../../../features/pages/active-games/active-games.component';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, ActiveGamesComponent],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent {
  session$: Observable<Session | null>;
  isCollapsed = true;
  isDropdownOpen = false;

  constructor(private readonly authService: AuthService, private readonly router: Router) {
    this.session$ = this.authService.session$;
  }

  toggleDropdown(event: Event) {
    event.stopPropagation();
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  logout() {
    this.authService.logout();
    this.isCollapsed = true;
    this.isDropdownOpen = false;
  }

  @HostListener('document:click')
  closeDropdown() {
    this.isDropdownOpen = false;
  }
}
