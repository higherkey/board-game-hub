import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LogoComponent } from '../../shared/logo/logo.component';

@Component({
   selector: 'app-layout',
   standalone: true,
   imports: [CommonModule, RouterModule, LogoComponent],
   template: `
    <div class="app-shell">
      <!-- HEADER -->
      <header class="main-header" role="banner">
        <div class="logo-container" routerLink="/" tabindex="0" (keyup.enter)="navigateToHome()" role="button" aria-label="Go to Home">
           <app-logo [size]="40" class="text-primary"></app-logo>
           <div class="logo-text ms-2">BoardGame<span class="text-primary">Hub</span></div>
        </div>
        
        <nav class="main-nav" role="navigation" aria-label="Main Navigation">
           <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="nav-item">Home</a>
           <a routerLink="/games" routerLinkActive="active" class="nav-item">Games</a>
           <a routerLink="/about" routerLinkActive="active" class="nav-item">About</a>
           <a routerLink="/social" routerLinkActive="active" class="nav-item">Social</a>
        </nav>
        
        <div class="auth-actions">
           <!-- Placeholder for login links -->
           <a routerLink="/login" class="btn btn-sm btn-outline-primary">Login</a>
           <a routerLink="/register" class="btn btn-sm btn-accent">Sign Up</a>
        </div>
      </header>

      <!-- CONTENT -->
      <main class="main-content" role="main">
         <ng-content></ng-content>
      </main>

      <!-- FOOTER -->
      <footer class="main-footer" role="contentinfo">
         <div class="footer-content">
            <div class="mb-2 opacity-50">
                <app-logo [size]="24" class="text-secondary"></app-logo>
            </div>
            <p>&copy; 2025 BoardGameHub. <span class="text-accent">Play Connected.</span></p>
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
       height: 80px;
       background: rgba(255,255,255,0.95); /* Glass-like */
       backdrop-filter: blur(10px);
       border-bottom: 3px solid var(--bg-surface-2);
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
       font-size: 1.5rem;
       font-weight: 800;
       letter-spacing: -0.05em;
       color: var(--primary);
    }

    .main-nav {
       display: flex;
       gap: var(--space-lg);
       
       .nav-item {
          color: var(--text-secondary);
          text-decoration: none;
          font-weight: 700;
          text-transform: uppercase;
          font-size: 0.9rem;
          letter-spacing: 0.05em;
          transition: all 0.2s;
          padding: 0.5rem 0;
          border-bottom: 3px solid transparent;
          
          &:hover {
             color: var(--primary);
          }
          
          &.active {
             color: var(--primary);
             border-bottom-color: var(--accent);
          }
       }
    }

    .auth-actions {
       display: flex;
       gap: var(--space-md);
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
       background: var(--text-primary); /* Dark Navy Footer */
       padding: var(--space-md) var(--space-lg); /* Reduced padding */
       text-align: center;
       color: rgba(255,255,255,0.6);
       font-size: 0.85rem;
       margin-top: auto;
    }
  `]
})
export class LayoutComponent {
   navigateToHome() {
      // Router link handles click logic
   }
}
