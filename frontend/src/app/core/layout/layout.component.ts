import { CommonModule } from '@angular/common';
import { Component, HostListener, inject, ChangeDetectionStrategy, ElementRef, ViewChild } from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter, map, startWith } from 'rxjs/operators';
import { ActiveGamesComponent } from '../../features/active-games/active-games.component';
import { AuthService } from '../../services/auth.service';
import { SignalRService } from '../../services/signalr.service';
import { UserProfileDropdownComponent } from '../../shared/components/user-profile-dropdown/user-profile-dropdown.component';
import { LogoComponent } from '../../shared/logo/logo.component';
import { environment } from '../../../environments/environment';

@Component({
   selector: 'app-layout',
   standalone: true,
   imports: [CommonModule, RouterModule, LogoComponent, ActiveGamesComponent, UserProfileDropdownComponent],
   templateUrl: './layout.component.html',
   changeDetection: ChangeDetectionStrategy.Eager,
   styleUrls: ['./layout.component.scss']
})
export class LayoutComponent {
   private readonly authService = inject(AuthService);
   private readonly signalRService = inject(SignalRService);
   private readonly router = inject(Router);

   readonly version = environment.version;
   session$ = this.authService.session$;
   activeGamesCount$ = this.signalRService.activeRooms$.pipe(
      map(rooms => rooms.length)
   );

   isGameRoom$ = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(event => event.urlAfterRedirects.includes('/game/')),
      startWith(this.router.url.includes('/game/'))
   );

   mobileMenuOpen = false;
   @ViewChild('navToggle') navToggle?: ElementRef<HTMLButtonElement>;
   isScrolled = false;

   @HostListener('window:scroll', [])
   onWindowScroll() {
      this.isScrolled = window.scrollY > 20;
   }

   toggleMobileMenu() {
      this.mobileMenuOpen = !this.mobileMenuOpen;
   }

   closeMobileMenu() {
      this.mobileMenuOpen = false;
   }

   @HostListener('document:keydown.escape', ['$event'])
   closeMenuOnEscape(event: Event) {
      if (!this.mobileMenuOpen) return;
      this.closeMobileMenu();
      this.navToggle?.nativeElement.focus();
      event.preventDefault();
   }

   navigateToHome() {
      this.closeMobileMenu();
   }



   @HostListener('document:click')
   onDocumentClick() {
      // No global click handling needed for shared component
   }

   logout() {
      this.authService.logout();
      this.closeMobileMenu();
   }
}
