import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot } from '@angular/router';
import { AppTitleStrategy } from './title-strategy.service';

describe('AppTitleStrategy', () => {
    let service: AppTitleStrategy;
    let titleService: Title;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [AppTitleStrategy, Title]
        });
        service = TestBed.inject(AppTitleStrategy);
        titleService = TestBed.inject(Title);
        spyOn(titleService, 'setTitle');
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should set title to BGHub if no title is built', () => {
        spyOn(service, 'buildTitle').and.returnValue(undefined);
        service.updateTitle({} as RouterStateSnapshot);
        expect(titleService.setTitle).toHaveBeenCalledWith('BGHub');
    });

    it('should set title to BGHub | Title if title is built', () => {
        spyOn(service, 'buildTitle').and.returnValue('Test');
        service.updateTitle({} as RouterStateSnapshot);
        expect(titleService.setTitle).toHaveBeenCalledWith('BGHub | Test');
    });
});
