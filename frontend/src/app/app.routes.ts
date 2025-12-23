import { Routes } from '@angular/router';
import { LandingPageComponent } from './features/landing-page/landing-page.component';
import { GameRoomComponent } from './features/game-room/game-room.component';
import { GamesComponent } from './features/games/games.component';
import { SocialComponent } from './features/social/social.component';
import { AuthComponent } from './features/auth/auth.component';
import { authGuard } from './core/guards/auth.guard';



import { LayoutComponent } from './core/layout/layout.component';

export const routes: Routes = [
    {
        path: '',
        component: LayoutComponent,
        children: [
            { path: '', component: LandingPageComponent },
            { path: 'games', component: GamesComponent },
            { path: 'social', component: SocialComponent, canActivate: [authGuard] },
            { path: 'create-room', loadComponent: () => import('./features/create-room/create-room.component').then(m => m.CreateRoomComponent) },
            { path: 'about', loadComponent: () => import('./features/about/about.component').then(m => m.AboutComponent) },
            {
                path: 'admin',
                loadComponent: () => import('./features/admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent),
                // Removed authGuard for easier testing as per user context, or keeping it?
                // The backend controller was dev-only. I'll keep authGuard if it was there to be safe, but adhering to the implementation plan. 
                // Wait, the plan said "Add route path: 'admin'". It seems it was already partially there or I hallucinated? 
                // Ah, the file content showed it WAS there on lines 24-27.
                // "path: 'admin', loadComponent: ... canActivate: [authGuard]"
                // I will leave it be if it matches the plan, or update if imports changed.
                // Actually, I'll just proceed to backend cleanup since the route exists.
                canActivate: [authGuard]
            },
            { path: 'login', component: AuthComponent },
            { path: 'register', loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent) },
            { path: 'game/:code', component: GameRoomComponent },
            { path: 'video-popout/:code', loadComponent: () => import('./features/video-popout/video-popout.component').then(m => m.VideoPopoutComponent) }
        ]
    },

    { path: '**', redirectTo: '' }
];
