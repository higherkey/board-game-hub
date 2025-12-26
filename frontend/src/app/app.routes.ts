import { Routes } from '@angular/router';
import { LandingPageComponent } from './features/landing-page/landing-page.component';
import { GameRoomComponent } from './features/game-room/game-room.component';
import { GamesComponent } from './features/games/games.component';
import { PlayComponent } from './features/play/play.component';
import { SocialComponent } from './features/social/social.component';
import { AuthComponent } from './features/auth/auth.component';
import { authGuard } from './core/guards/auth.guard';



import { LayoutComponent } from './core/layout/layout.component';

export const routes: Routes = [
    {
        path: 'admin',
        loadComponent: () => import('./features/admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent),
        canActivate: [authGuard],
        title: 'Admin Dashboard'
    },
    {
        path: '',
        component: LayoutComponent,
        children: [
            { path: '', component: LandingPageComponent, title: 'Home' },
            { path: 'play', component: PlayComponent, title: 'Play & Connect' },
            { path: 'games', component: GamesComponent, title: 'Games Library' },
            { path: 'social', component: SocialComponent, canActivate: [authGuard], title: 'Social' },
            { path: 'about', loadComponent: () => import('./features/about/about.component').then(m => m.AboutComponent), title: 'About' },
            { path: 'login', component: AuthComponent, title: 'Login' },
            { path: 'register', loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent), title: 'Register' },
            { path: 'game/:code', component: GameRoomComponent, title: 'Game Room' },
            { path: 'video-popout/:code', loadComponent: () => import('./features/video-popout/video-popout.component').then(m => m.VideoPopoutComponent), title: 'Video Chat' }
        ]
    },

    { path: '**', redirectTo: '' }
];
