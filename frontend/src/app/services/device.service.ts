import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DeviceService {
  private readonly isMobileSubject = new BehaviorSubject<boolean>(this.checkMobile());
  readonly isMobile$: Observable<boolean> = this.isMobileSubject.asObservable();

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', () => {
        this.isMobileSubject.next(this.checkMobile());
      });
    }
  }

  /**
   * Automatic mobile detection.
   * Respects Chrome/Safari "Desktop Site" settings naturally:
   * when "Desktop site" is requested in browser settings, User-Agent loses 'Mobile'
   * and window.innerWidth increases, causing this to return false (Desktop mode).
   */
  private checkMobile(): boolean {
    if (typeof window === 'undefined') return false;
    const userAgentMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const viewportMobile = window.innerWidth <= 768;
    return userAgentMobile && viewportMobile;
  }

  get isMobileValue(): boolean {
    return this.checkMobile();
  }
}
