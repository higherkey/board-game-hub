import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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

    constructor(private readonly http: HttpClient) { }

    debug(message: string, ...args: any[]): void {
        if (this.canLog(LogLevel.DEBUG)) {
            console.debug(`[DEBUG] ${message}`, ...args);
            this.sendToRemote('DEBUG', message, args);
        }
    }

    info(message: string, ...args: any[]): void {
        if (this.canLog(LogLevel.INFO)) {
            console.info(`[INFO] ${message}`, ...args);
            this.sendToRemote('INFO', message, args);
        }
    }

    warn(message: string, ...args: any[]): void {
        if (this.canLog(LogLevel.WARN)) {
            console.warn(`[WARN] ${message}`, ...args);
            this.sendToRemote('WARN', message, args);
        }
    }

    error(message: string, ...args: any[]): void {
        if (this.canLog(LogLevel.ERROR)) {
            console.error(`[ERROR] ${message}`, ...args);
            this.sendToRemote('ERROR', message, args);
        }
    }

    private canLog(level: LogLevel): boolean {
        return level >= this.currentLogLevel;
    }

    private sendToRemote(level: string, message: string, data: any[]): void {
        if (environment.remoteLogging) {
            this.http.post(`${environment.apiUrl}/ClientLogging`, {
                level,
                message,
                data: data.length > 0 ? data : null
            }).subscribe({
                error: (err) => console.error('Failed to send log to remote', err)
            });
        }
    }
}
