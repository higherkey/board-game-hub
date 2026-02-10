import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface ConfirmOptions {
    title?: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    icon?: string;
    iconClass?: string;
    confirmButtonClass?: string;
    position?: { top: number; left: number; width: number; height: number };
}

@Injectable({
    providedIn: 'root'
})
export class ConfirmService {
    private component: any;
    private confirmSource = new Subject<boolean>();

    register(component: any) {
        this.component = component;
    }

    confirm(options: ConfirmOptions, event?: MouseEvent): Promise<boolean> {
        if (!this.component) {
            return Promise.resolve(confirm(options.message));
        }

        if (event) {
            const target = event.currentTarget as HTMLElement;
            const rect = target.getBoundingClientRect();
            options.position = {
                top: rect.top + window.scrollY,
                left: rect.left + window.scrollX,
                width: rect.width,
                height: rect.height
            };
        }

        this.component.show(options);
        return new Promise((resolve) => {
            const subscription = this.confirmSource.subscribe((result) => {
                subscription.unsubscribe();
                resolve(result);
            });
        });
    }

    resolve(result: boolean) {
        this.confirmSource.next(result);
    }
}
