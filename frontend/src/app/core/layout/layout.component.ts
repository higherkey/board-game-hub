import { Component, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { LogoComponent } from '../../shared/logo/logo.component';
import { AuthService } from '../../services/auth.service';

import { ActiveGamesComponent } from '../../features/active-games/active-games.component';
import { SignalRService } from '../../services/signalr.service';
import { map } from 'rxjs/operators';

@Component({
   selector: 'app-layout',
   standalone: true,
   imports: [CommonModule, RouterModule, LogoComponent, ActiveGamesComponent],
   template: `
    <div class="app-shell">
      <!-- HEADER -->
      <header class="main-header" role="banner">
        <div class="header-container">
          <div class="d-flex align-items-center gap-3">
               <button class="mobile-toggle" (click)="toggleMobileMenu()" aria-label="Toggle Navigation">
                   <i class="bi" [class.bi-list]="!mobileMenuOpen" [class.bi-x-lg]="mobileMenuOpen"></i>
               </button>

               <div class="logo-container" routerLink="/" tabindex="0" (keyup.enter)="navigateToHome()" role="button" aria-label="Go to Home">
                  <app-logo [size]="40" class="text-primary"></app-logo>
                  <div class="logo-text ms-2 d-none d-sm-block">BoardGame<span class="text-primary">Hub</span></div>
                  <div class="logo-text ms-2 d-sm-none">BG<span class="text-primary">H</span></div>
               </div>
          </div>

          <nav class="main-nav" [class.open]="mobileMenuOpen" role="navigation" aria-label="Main Navigation">
             <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="nav-item" (click)="closeMobileMenu()">Home</a>
             <a routerLink="/play" routerLinkActive="active" class="nav-item" (click)="closeMobileMenu()">Play</a>
             <a routerLink="/games" routerLinkActive="active" class="nav-item" (click)="closeMobileMenu()">Games</a>
             <a routerLink="/about" routerLinkActive="active" class="nav-item" (click)="closeMobileMenu()">About</a>
             <a routerLink="/social" routerLinkActive="active" class="nav-item" (click)="closeMobileMenu()">Social</a>
          </nav>
          
          <div class="auth-actions">
             <!-- Unified Session View -->
             <ng-container *ngIf="session$ | async as session; else loginTemplate">
                <!-- Active Tables (Only visible with session and active games) -->
                <div class="active-games-wrapper" *ngIf="!isBackendPort && (activeGamesCount$ | async) as count">
                   <app-active-games *ngIf="count > 0"></app-active-games>
                </div>

                <!-- Consolidated Profile Dropdown -->
                <div class="dropdown">
                    <button class="d-flex align-items-center bg-transparent border-0 p-0 pointer profile-trigger gap-2"
                        type="button" id="userMenu" (click)="toggleDropdown($event)" aria-expanded="false">
                        
                        <div class="avatar-container position-relative">
                            <img *ngIf="session.avatarUrl; else guestIcon" [src]="session.avatarUrl" alt="Avatar"
                                class="rounded-circle border border-2 border-warning shadow-sm" width="40" height="40">
                            <ng-template #guestIcon>
                                <div class="guest-avatar rounded-circle border border-2 border-info d-flex align-items-center justify-content-center bg-dark shadow-sm" 
                                     style="width: 40px; height: 40px;">
                                    <i class="bi bi-person-fill text-info fs-5"></i>
                                </div>
                            </ng-template>
                            <i class="bi bi-chevron-down position-absolute" 
                               style="bottom: -2px; right: -4px; font-size: 0.7rem; background: var(--bg-surface); border-radius: 50%; padding: 1px; color: var(--text-secondary);"></i>
                        </div>

                        <div class="d-flex flex-column align-items-start line-height-1">
                            <span class="user-name-text fw-bold" style="font-size: 0.9rem;">{{ session.name }}</span>
                            <span *ngIf="session.isGuest" class="badge rounded-pill bg-info text-dark" style="font-size: 0.6rem; padding: 0.2rem 0.5rem;">Guest</span>
                        </div>
                    </button>

                    <ul class="dropdown-menu dropdown-menu-end bg-dark border-secondary shadow mt-2"
                        [class.show]="isDropdownOpen" aria-labelledby="userMenu" style="right: 0; left: auto;">
                        <li class="px-3 py-2 border-bottom border-secondary mb-1">
                            <div class="small text-muted text-uppercase fw-bold" style="font-size: 0.65rem;">Account</div>
                            <div class="text-white fw-bold truncate" style="max-width: 150px;">{{ session.name }}</div>
                        </li>
                        <li><a class="dropdown-item text-white" routerLink="/settings" (click)="closeDropdown()"><i class="bi bi-gear me-2"></i>Settings</a></li>
                        <li *ngIf="!session.isGuest"><a class="dropdown-item text-white" routerLink="/profile" (click)="closeDropdown()"><i class="bi bi-person me-2"></i>My Profile</a></li>
                        <li><hr class="dropdown-divider border-secondary"></li>
                        <li><button class="dropdown-item text-danger" (click)="logout()">
                            <i class="bi bi-box-arrow-right me-2"></i>{{ session.isGuest ? 'Leave Session' : 'Sign Out' }}
                        </button></li>
                    </ul>
                </div>
             </ng-container>

             <!-- Not Logged In -->
             <ng-template #loginTemplate>
                <a routerLink="/login" class="btn btn-sm btn-primary">Login</a>
                <a routerLink="/register" class="btn btn-sm btn-secondary text-white">Sign Up</a>
             </ng-template>
          </div>
        </div>
      </header>

      <!-- CONTENT -->
      <main class="main-content" role="main">
         <router-outlet></router-outlet>
      </main>

      <!-- FOOTER -->
      <footer class="main-footer" role="contentinfo">
         <div class="footer-content d-flex justify-content-center align-items-center gap-3 opacity-75">
            <app-logo [size]="24" class="text-secondary"></app-logo>
            <p class="m-0">&copy; 2025 BoardGameHub. <span class="text-accent">Play Connected.</span></p>
         </div>
      </footer>
    </div>
  `,
   styles: [`
    .app-shell {
       display: flex;
       flex-direction: column;
       min-height: 100vh;
    }

     .main-header {
        display: flex;
        align-items: center;
        padding: 0 2rem;
        height: var(--header-height);
        background: var(--bg-overlay);
        backdrop-filter: blur(12px);
        border-bottom: 1px solid rgba(0, 51, 102, 0.1);
        position: sticky;
        top: 0;
        z-index: 1000;
        box-shadow: var(--shadow-sm);

        @media (max-width: 992px) {
            padding: 0 1.25rem;
        }
     }

     .header-container {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        height: 100%;

        @media (min-width: 993px) {
            display: grid;
            grid-template-columns: 1fr auto 1fr;
            gap: 1.5rem;
        }
     }

     .logo-container {
        display: flex;
        align-items: center;
        cursor: pointer;
        outline: none;
        
        &:focus {
           opacity: 0.8;
        }

        app-logo ::ng-deep img {
           transition: none;
        }

        @media (max-width: 992px) {
           app-logo ::ng-deep img {
              width: 32px !important;
              height: 32px !important;
           }
        }
     }

     .logo-text {
        font-family: 'Outfit', sans-serif;
        font-size: 1.5rem;
        font-weight: 800;
        letter-spacing: -0.02em;
        color: var(--primary);
        text-transform: uppercase;
        white-space: nowrap;

        @media (max-width: 992px) {
            font-size: 1.25rem;
        }
     }

    .mobile-toggle {
       display: none;
       background: none;
       border: none;
       font-size: 1.5rem;
       color: var(--primary);
       cursor: pointer;
       padding: 0.25rem;
       margin-left: -0.25rem;
       
       @media (max-width: 992px) {
           display: block;
       }
    }

    .main-nav {
       display: flex;
       gap: 2.5rem;
       justify-content: center;
       
       @media (max-width: 1200px) {
           gap: 1.5rem;
       }

       @media (max-width: 992px) {
           position: fixed;
           top: var(--header-height);
           left: 0;
           right: 0;
           background: var(--bg-surface);
           flex-direction: column;
           padding: var(--space-lg);
           gap: var(--space-md);
           border-bottom: 2px solid var(--accent);
           box-shadow: var(--shadow-xl);
           transform: translateY(-150%);
           opacity: 0;
           visibility: hidden;
           transition: all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
           z-index: 999;
           border-bottom-left-radius: var(--radius-md);
           border-bottom-right-radius: var(--radius-md);

           &.open {
               transform: translateY(0);
               opacity: 1;
               visibility: visible;
           }
       }
       
       .nav-item {
          color: var(--text-secondary);
          text-decoration: none;
          font-weight: 600;
          text-transform: uppercase;
          font-size: 0.85rem;
          letter-spacing: 0.05em;
          transition: all 0.2s;
          position: relative;
          padding: 0.5rem 0;
          
          &:after {
             content: '';
             position: absolute;
             bottom: 0;
             left: 0;
             width: 0;
             height: 2px;
             background: var(--accent);
             transition: width 0.3s ease;
          }
          
          &:hover {
             color: var(--primary);
             &:after { width: 100%; }
          }
          
          &.active {
             color: var(--primary);
             &:after { width: 100%; }
          }
       }
    }

     .auth-actions {
        display: flex;
        gap: clamp(0.4rem, 1vw, 0.75rem);
        align-items: center;
        justify-content: flex-end;

        .btn {
            white-space: nowrap;
            min-width: fit-content;
            padding-left: 1rem;
            padding-right: 1rem;
            font-size: 0.8rem;
        }
     }

    /* Dropdown Styles Override */
    .profile-trigger {
        outline: none;
        transition: opacity 0.2s;
        
        &:hover {
            opacity: 0.9;
        }

        .user-name-text {
            color: var(--text-primary);
        }
    }

    .dropdown-menu {
        min-width: 200px;
        border: 1px solid rgba(255,255,255,0.1);
    }

    .dropdown-item:hover, .dropdown-item:focus, .dropdown-item:active {
        color: #000 !important;
        background-color: #f8f9fa;
        cursor: pointer;
    }

    .truncate {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .main-content {
       flex: 1;
       padding: var(--space-lg);
       max-width: 1400px;
       margin: 0 auto;
       width: 100%;
       box-sizing: border-box;
    }

    .main-footer {
       background: var(--primary);
       color: rgba(255, 255, 255, 0.8);
       padding: var(--space-lg) var(--space-lg);
       text-align: center;
       font-size: 0.9rem;
       margin-top: auto;
       position: relative;
       
       &:before {
          content: '';
          position: absolute;
          top: -10px;
          left: 0;
          right: 0;
          height: 11px;
          background-color: var(--primary);
          clip-path: polygon(
             0% 100%, 5% 0%, 10% 100%, 15% 0%, 20% 100%, 25% 0%, 30% 100%, 
             35% 0%, 40% 100%, 45% 0%, 50% 100%, 55% 0%, 60% 100%, 65% 0%, 
             70% 100%, 75% 0%, 80% 100%, 85% 0%, 90% 100%, 95% 0%, 100% 100%
          );
       }
    }
   `]
})
export class LayoutComponent {
   private readonly authService = inject(AuthService);
   private readonly signalRService = inject(SignalRService);
   private readonly router = inject(Router);

   session$ = this.authService.session$;
   activeGamesCount$ = this.signalRService.activeRooms$.pipe(
      map(rooms => rooms.length)
   );

   mobileMenuOpen = false;
   isDropdownOpen = false;
   isBackendPort = globalThis.location.port !== '4200';

   toggleMobileMenu() {
      this.mobileMenuOpen = !this.mobileMenuOpen;
   }

   closeMobileMenu() {
      this.mobileMenuOpen = false;
   }

   navigateToHome() {
      this.closeMobileMenu();
   }

   toggleDropdown(event: Event) {
      event.stopPropagation();
      this.isDropdownOpen = !this.isDropdownOpen;
   }

   closeDropdown() {
      this.isDropdownOpen = false;
   }

   @HostListener('document:click')
   onDocumentClick() {
      this.closeDropdown();
   }

   logout() {
      this.authService.logout();
      this.closeMobileMenu();
      this.isDropdownOpen = false;
   }
}
