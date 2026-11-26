import { TestBed } from '@angular/core/testing';
import { NavigationEnd, Router } from '@angular/router';
import { SwUpdate, UnrecoverableStateEvent, VersionEvent } from '@angular/service-worker';
import { Subject } from 'rxjs';
import { ToastService } from '../../shared/services/toast.service';
import { AppUpdateService } from './app-update.service';
import { LoggerService } from './logger.service';

describe('AppUpdateService', () => {
    let service: AppUpdateService;
    let versionUpdates: Subject<VersionEvent>;
    let unrecoverable: Subject<UnrecoverableStateEvent>;
    let routerEvents: Subject<unknown>;
    let router: { url: string; events: Subject<unknown> };
    let toast: jasmine.SpyObj<ToastService>;
    let reloadSpy: jasmine.Spy;

    const versionReady = (): VersionEvent => ({
        type: 'VERSION_READY',
        currentVersion: { hash: 'old' },
        latestVersion: { hash: 'new' }
    });

    const navigateTo = (url: string) => {
        router.url = url;
        routerEvents.next(new NavigationEnd(1, url, url));
    };

    function setup(isEnabled = true) {
        versionUpdates = new Subject<VersionEvent>();
        unrecoverable = new Subject<UnrecoverableStateEvent>();
        routerEvents = new Subject<unknown>();
        router = { url: '/', events: routerEvents };
        toast = jasmine.createSpyObj<ToastService>('ToastService', ['show']);

        TestBed.configureTestingModule({
            providers: [
                AppUpdateService,
                {
                    provide: SwUpdate,
                    useValue: {
                        isEnabled,
                        versionUpdates,
                        unrecoverable,
                        checkForUpdate: jasmine.createSpy('checkForUpdate').and.resolveTo(false)
                    }
                },
                { provide: Router, useValue: router },
                { provide: ToastService, useValue: toast },
                { provide: LoggerService, useValue: jasmine.createSpyObj('LoggerService', ['info', 'warn', 'error', 'debug']) }
            ]
        });
        service = TestBed.inject(AppUpdateService);
        reloadSpy = spyOn<any>(service, 'reload');
        service.init();
    }

    it('does nothing when the service worker is disabled', () => {
        setup(false);
        versionUpdates.next(versionReady());
        navigateTo('/shelf');
        expect(reloadSpy).not.toHaveBeenCalled();
    });

    it('waits for a navigation before applying a ready update', () => {
        setup();
        router.url = '/play';
        versionUpdates.next(versionReady());
        expect(reloadSpy).not.toHaveBeenCalled();

        navigateTo('/shelf');
        expect(reloadSpy).toHaveBeenCalledTimes(1);
    });

    it('never reloads inside a live game room', () => {
        setup();
        versionUpdates.next(versionReady());
        navigateTo('/game/ABCD');
        expect(reloadSpy).not.toHaveBeenCalled();

        navigateTo('/play');
        expect(reloadSpy).toHaveBeenCalledTimes(1);
    });

    it('does not reload on navigation when no update is pending', () => {
        setup();
        navigateTo('/shelf');
        expect(reloadSpy).not.toHaveBeenCalled();
    });

    it('reloads immediately on an unrecoverable state outside a game', () => {
        setup();
        router.url = '/shelf';
        unrecoverable.next({ type: 'UNRECOVERABLE_STATE', reason: 'evicted' });
        expect(reloadSpy).toHaveBeenCalled();
    });

    it('asks the player to refresh later on an unrecoverable state mid-game', () => {
        setup();
        router.url = '/game/ABCD';
        unrecoverable.next({ type: 'UNRECOVERABLE_STATE', reason: 'evicted' });
        expect(reloadSpy).not.toHaveBeenCalled();
        expect(toast.show).toHaveBeenCalledWith(jasmine.any(String), 'warning', 0);
    });
});
