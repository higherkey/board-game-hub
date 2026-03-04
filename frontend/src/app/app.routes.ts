import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { LayoutComponent } from './core/layout/layout.component';
import { GameRoomComponent } from './features/game-room/game-room.component';
import { GamesComponent } from './features/pages/games-page/games.component';
import { LandingPageComponent } from './features/pages/home-page/home-page.component';
import { AuthComponent } from './features/pages/login-page/login.component';
import { PlayComponent } from './features/pages/play-page/play.component';
import { SocialComponent } from './features/pages/social-page/social.component';
import { NotFoundComponent } from './features/pages/not-found-page/not-found.component';

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
            { path: 'games/:gameId', loadComponent: () => import('./features/pages/game-detail-page/game-detail.component').then(m => m.GameDetailComponent), title: 'Game Details' },
            { path: 'social', component: SocialComponent, canActivate: [authGuard], title: 'Social' },
            { path: 'social/:gameId', loadComponent: () => import('./features/pages/game-social/game-social.component').then(m => m.GameSocialComponent), title: 'Game Social Hub' },
            { path: 'history', loadComponent: () => import('./features/game-history/game-history.component').then(m => m.GameHistoryComponent), canActivate: [authGuard], title: 'Game History' },
            { path: 'profile', loadComponent: () => import('./features/pages/profile-page/profile-page.component').then(m => m.ProfilePageComponent), title: 'My Profile' },
            { path: 'about', loadComponent: () => import('./features/pages/about-page/about.component').then(m => m.AboutComponent), title: 'About' },
            { path: 'login', component: AuthComponent, title: 'Login' },
            { path: 'register', loadComponent: () => import('./features/pages/register-page/register.component').then(m => m.RegisterComponent), title: 'Register' },
            { path: 'game/:code', component: GameRoomComponent, title: 'Game Room' },
            { path: 'video-popout/:code', loadComponent: () => import('./features/game-room/components/video-chat/video-popout/video-popout.component').then(m => m.VideoPopoutComponent), title: 'Video Chat' },
            { path: 'not-found', component: NotFoundComponent, title: '404 - Page Not Found' }
        ]
    },

    { path: '**', component: NotFoundComponent }
];
