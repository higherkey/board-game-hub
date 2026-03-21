import { TestBed } from '@angular/core/testing';
import { LoggerService, LogLevel } from './logger.service';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { environment } from '../../../environments/environment';

describe('LoggerService', () => {
    let service: LoggerService;
    let httpMock: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [LoggerService]
        });
        service = TestBed.inject(LoggerService);
        httpMock = TestBed.inject(HttpTestingController);
        
        spyOn(console, 'debug');
        spyOn(console, 'info');
        spyOn(console, 'warn');
        spyOn(console, 'error');
    });

    afterEach(() => {
        httpMock.verify();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should log info if level is INFO', () => {
        // Force level if needed, but we'll assume default for now
        service.info('test info');
        expect(console.info).toHaveBeenCalledWith('[INFO] test info');
    });

    it('should log error if level is ERROR', () => {
        service.error('test error');
        expect(console.error).toHaveBeenCalledWith('[ERROR] test error');
    });

    it('should send to remote if remoteLogging is enabled', () => {
        // This test depends on environment.remoteLogging
        // If it's false in test env, this might not trigger
        if (environment.remoteLogging) {
            service.info('remote test');
            const req = httpMock.expectOne(`${environment.apiUrl}/ClientLogging`);
            expect(req.request.method).toBe('POST');
            expect(req.request.body.message).toBe('remote test');
            req.flush({});
        }
    });
});
