import { DOCUMENT } from '@angular/common';
import { DestroyRef, Injectable, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { SwUpdate } from '@angular/service-worker';
import { filter } from 'rxjs';
import { ToastService } from '../../shared/services/toast.service';
import { LoggerService } from './logger.service';

/** Routes where a page reload would drop the player out of a live room. */
const LIVE_GAME_ROUTE = /^\/game\//;

/**
 * Applies new service-worker versions without interrupting play.
 *
 * A downloaded update is held until the next navigation that lands outside a
 * live game room, then the page reloads onto the new version. Waiting for a
 * navigation (rather than reloading as soon as it is ready) avoids wiping a
 * half-typed room code or form. Both Table and
 * Hand devices sit on `/game/:code` for a whole session, so neither is ever
 * reloaded mid-game; the old version keeps serving them, including its lazy
 * chunks, until they leave the room or relaunch the app.
 */
@Injectable({ providedIn: 'root' })
export class AppUpdateService {
    private readonly swUpdate = inject(SwUpdate);
    private readonly router = inject(Router);
    private readonly document = inject(DOCUMENT);
    private readonly toast = inject(ToastService);
    private readonly logger = inject(LoggerService);
    private readonly destroyRef = inject(DestroyRef);

    private updatePending = false;
    private started = false;

    init(): void {
        if (this.started || !this.swUpdate.isEnabled) return;
        this.started = true;

        this.swUpdate.versionUpdates
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(event => {
                switch (event.type) {
                    case 'VERSION_READY':
                        this.logger.info(`[AppUpdate] Version ${event.latestVersion.hash} ready`);
                        this.updatePending = true;
                        break;
                    case 'VERSION_INSTALLATION_FAILED':
                        this.logger.warn(`[AppUpdate] Failed to install ${event.version.hash}: ${event.error}`);
                        break;
                }
            });

        // The cached app can no longer load its own files (e.g. the browser evicted them).
        this.swUpdate.unrecoverable
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(event => {
                this.logger.error(`[AppUpdate] Unrecoverable state: ${event.reason}`);
                if (this.isLiveGame(this.router.url)) {
                    this.toast.show('The app needs to reload. Finish this game, then refresh.', 'warning', 0);
                } else {
                    this.reload();
                }
            });

        this.router.events
            .pipe(
                filter((e): e is NavigationEnd => e instanceof NavigationEnd),
                takeUntilDestroyed(this.destroyRef)
            )
            .subscribe(e => this.applyIfSafe(e.urlAfterRedirects));

        // Installed PWAs are often resumed rather than relaunched, so check when they come back.
        const onVisible = () => {
            if (this.document.visibilityState === 'visible') this.checkForUpdate();
        };
        this.document.addEventListener('visibilitychange', onVisible);
        this.destroyRef.onDestroy(() => this.document.removeEventListener('visibilitychange', onVisible));
    }

    private applyIfSafe(url: string): void {
        if (this.updatePending && !this.isLiveGame(url)) {
            this.updatePending = false;
            this.reload();
        }
    }

    private checkForUpdate(): void {
        this.swUpdate.checkForUpdate().catch(err => this.logger.warn('[AppUpdate] Update check failed', err));
    }

    private isLiveGame(url: string): boolean {
        return LIVE_GAME_ROUTE.test(url);
    }

    protected reload(): void {
        this.document.location.reload();
    }
}
