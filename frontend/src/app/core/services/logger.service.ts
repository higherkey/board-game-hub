import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

export enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3,
    OFF = 4
}

@Injectable({
    providedIn: 'root'
})
export class LoggerService {
    private readonly currentLogLevel: LogLevel = environment.logLevel ?? LogLevel.INFO;

    debug(message: string, ...args: any[]): void {
        if (this.canLog(LogLevel.DEBUG)) {
            console.debug(`[DEBUG] ${message}`, ...args);
        }
    }

    info(message: string, ...args: any[]): void {
        if (this.canLog(LogLevel.INFO)) {
            console.info(`[INFO] ${message}`, ...args);
        }
    }

    warn(message: string, ...args: any[]): void {
        if (this.canLog(LogLevel.WARN)) {
            console.warn(`[WARN] ${message}`, ...args);
        }
    }

    error(message: string, ...args: any[]): void {
        if (this.canLog(LogLevel.ERROR)) {
            console.error(`[ERROR] ${message}`, ...args);
        }
    }

    private canLog(level: LogLevel): boolean {
        return level >= this.currentLogLevel;
    }
}
