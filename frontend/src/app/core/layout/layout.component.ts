import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { LogoComponent } from '../../shared/logo/logo.component';
import { AuthService } from '../../services/auth.service';

import { ActiveGamesComponent } from '../../features/active-games/active-games.component';

@Component({
   selector: 'app-layout',
   standalone: true,
   imports: [CommonModule, RouterModule, LogoComponent, ActiveGamesComponent],
   template: `
    <div class="app-shell">
      <!-- HEADER -->
      <header class="main-header" role="banner">
        <div class="d-flex align-items-center gap-3">
             <div class="logo-container" routerLink="/" tabindex="0" (keyup.enter)="navigateToHome()" role="button" aria-label="Go to Home">
                <app-logo [size]="40" class="text-primary"></app-logo>
                <div class="logo-text ms-2 d-none d-sm-block">BoardGame<span class="text-primary">Hub</span></div>
             </div>
        </div>
        
        <button class="mobile-toggle" (click)="toggleMobileMenu()" aria-label="Toggle Navigation">
            <i class="bi" [class.bi-list]="!mobileMenuOpen" [class.bi-x-lg]="mobileMenuOpen"></i>
        </button>

        <nav class="main-nav" [class.open]="mobileMenuOpen" role="navigation" aria-label="Main Navigation">
           <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="nav-item" (click)="closeMobileMenu()">Home</a>
           <a routerLink="/play" routerLinkActive="active" class="nav-item" (click)="closeMobileMenu()">Play</a>
           <a routerLink="/games" routerLinkActive="active" class="nav-item" (click)="closeMobileMenu()">Games</a>
           <a routerLink="/about" routerLinkActive="active" class="nav-item" (click)="closeMobileMenu()">About</a>
           <a routerLink="/social" routerLinkActive="active" class="nav-item" (click)="closeMobileMenu()">Social</a>
        </nav>
        
        <div class="auth-actions">
           <app-active-games *ngIf="!isBackendPort"></app-active-games>

           <ng-container *ngIf="currentUser$ | async as user">
              <div class="user-profile">
                 <span class="username">{{ user.displayName }}</span>
                 <button routerLink="/settings" class="btn btn-sm btn-outline-primary">
                    <i class="bi bi-gear-fill"></i> Settings
                 </button>
                 <button (click)="logout()" class="btn btn-sm btn-ghost" title="Logout">
                    <i class="bi bi-box-arrow-right"></i>
                 </button>
              </div>
           </ng-container>

           <!-- Guest State -->
           <ng-container *ngIf="(currentUser$ | async) === null && isGuest">
                <div class="user-profile">
                    <span class="username text-secondary">Guest</span>
                    <button (click)="logout()" class="btn btn-sm btn-ghost" title="Leave Guest Session">
                        <i class="bi bi-box-arrow-right"></i>
                    </button>
                </div>
           </ng-container>

           <!-- Not Logged In -->
           <ng-container *ngIf="(currentUser$ | async) === null && !isGuest">
              <a routerLink="/login" class="btn btn-sm btn-primary">Login</a>
              <a routerLink="/register" class="btn btn-sm btn-secondary text-white">Sign Up</a>
           </ng-container>
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
       justify-content: space-between;
       padding: 0 var(--space-lg);
       height: var(--header-height);
       background: var(--bg-overlay);
       backdrop-filter: blur(12px);
       border-bottom: 1px solid rgba(0, 51, 102, 0.1);
       position: sticky;
       top: 0;
       z-index: 1000;
       box-shadow: var(--shadow-sm);
    }

    .logo-container {
       display: flex;
       align-items: center;
       cursor: pointer;
       outline: none;
       
       &:focus {
          opacity: 0.8;
       }
    }

    .logo-text {
       font-family: 'Outfit', sans-serif; /* If available, or bold serif */
       font-size: 1.5rem;
       font-weight: 800;
       letter-spacing: -0.02em;
       color: var(--primary);
       text-transform: uppercase;
    }

   .mobile-toggle {
       display: none;
       background: none;
       border: none;
       font-size: 1.5rem;
       color: var(--primary);
       cursor: pointer;
       padding: 0.5rem;
       
       @media (max-width: 768px) {
           display: block;
       }
    }

    .main-nav {
       display: flex;
       gap: var(--space-lg);
       
       @media (max-width: 768px) {
           position: fixed;
           top: var(--header-height);
           left: 0;
           right: 0;
           background: var(--bg-surface);
           flex-direction: column;
           padding: var(--space-lg);
           gap: var(--space-md);
           border-bottom: 2px solid var(--accent); /* Accent border on mobile menu */
           box-shadow: var(--shadow-xl); /* Deeper shadow */
           transform: translateY(-150%); /* Start further up */
           opacity: 0;
           visibility: hidden;
           transition: all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1); /* Smoother bezier */
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
          /* ... existing styles ... */
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
       gap: var(--space-md);
       align-items: center;

       @media (max-width: 768px) {
           /* Hide auth actions on mobile if they don't fit, 
              OR put them in the mobile menu. 
              For now keeping them in header but scaling down if needed. */
       }
    }

    .user-profile {
        display: flex;
        align-items: center;
        gap: var(--space-md);

        .username {
            font-weight: 700;
            color: var(--text-primary);
        }

        .btn-ghost {
            color: var(--text-secondary);
            padding: 0.25rem 0.5rem;
            
            &:hover {
                color: var(--danger);
                background: rgba(220, 53, 69, 0.1);
            }
        }
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
       background: var(--primary); /* Navy Footer */
       color: rgba(255, 255, 255, 0.8);
       padding: var(--space-lg) var(--space-lg);
       text-align: center;
       font-size: 0.9rem;
       margin-top: auto;
       position: relative;
       
       /* Geometric Top Edge */
       &:before {
          content: '';
          position: absolute;
          top: -10px;
          left: 0;
          right: 0;
          height: 11px;
          background-color: var(--primary);
          clip-path: polygon(
             0% 100%, 
             5% 0%, 10% 100%, 
             15% 0%, 20% 100%, 
             25% 0%, 30% 100%, 
             35% 0%, 40% 100%, 
             45% 0%, 50% 100%, 
             55% 0%, 60% 100%, 
             65% 0%, 70% 100%, 
             75% 0%, 80% 100%, 
             85% 0%, 90% 100%, 
             95% 0%, 100% 100%
          );
       }
    }
  `]
})
export class LayoutComponent {
   private readonly authService = inject(AuthService);
   private readonly router = inject(Router);

   currentUser$ = this.authService.currentUser$;

   mobileMenuOpen = false;
   isBackendPort = globalThis.location.port !== '4200';

   get isGuest(): boolean {
      return this.authService.isAuthenticated();
   }

   toggleMobileMenu() {
      this.mobileMenuOpen = !this.mobileMenuOpen;
   }

   closeMobileMenu() {
      this.mobileMenuOpen = false;
   }

   navigateToHome() {
      this.closeMobileMenu();
   }

   logout() {
      this.authService.logout();
      this.closeMobileMenu();
      this.router.navigate(['/']);
   }
}
