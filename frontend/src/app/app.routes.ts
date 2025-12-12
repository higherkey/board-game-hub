import { Routes } from '@angular/router';
import { LandingPageComponent } from './features/landing-page/landing-page.component';
import { GameRoomComponent } from './features/game-room/game-room.component';
import { GamesComponent } from './features/games/games.component';
import { SocialComponent } from './features/social/social.component';
import { AuthComponent } from './features/auth/auth.component';
import { authGuard } from './core/guards/auth.guard';



export const routes: Routes = [
    { path: '', component: LandingPageComponent },
    { path: 'game/:code', component: GameRoomComponent },
    { path: 'games', component: GamesComponent },
    { path: 'social', component: SocialComponent, canActivate: [authGuard] },
    { path: 'login', component: AuthComponent },
    { path: 'register', loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent) },
    { path: 'create-room', loadComponent: () => import('./features/create-room/create-room.component').then(m => m.CreateRoomComponent) },
    { path: 'about', loadComponent: () => import('./features/about/about.component').then(m => m.AboutComponent) },
    {
        path: 'admin',
        loadComponent: () => import('./features/admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent),
        canActivate: [authGuard]
    },
    { path: '**', redirectTo: '' }
];
