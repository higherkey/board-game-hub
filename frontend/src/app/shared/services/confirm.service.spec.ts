import { TestBed } from '@angular/core/testing';
import { ConfirmService, ConfirmOptions } from './confirm.service';

describe('ConfirmService', () => {
    let service: ConfirmService;
    let mockComponent: any;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [ConfirmService]
        });
        service = TestBed.inject(ConfirmService);
        mockComponent = {
            show: jasmine.createSpy('show')
        };
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should use window.confirm if no component is registered', async () => {
        spyOn(window, 'confirm').and.returnValue(true);
        const result = await service.confirm({ message: 'test' });
        expect(window.confirm).toHaveBeenCalledWith('test');
        expect(result).toBeTrue();
    });

    it('should call component.show if registered', () => {
        service.register(mockComponent);
        const options: ConfirmOptions = { message: 'test' };
        service.confirm(options);
        expect(mockComponent.show).toHaveBeenCalledWith(options);
    });

    it('should resolve with the result from resolve()', async () => {
        service.register(mockComponent);
        const promise = service.confirm({ message: 'test' });
        service.resolve(true);
        const result = await promise;
        expect(result).toBeTrue();
    });

    it('should calculate position from MouseEvent', () => {
        service.register(mockComponent);
        const mockElement = {
            getBoundingClientRect: () => ({
                top: 10,
                left: 20,
                width: 100,
                height: 50
            })
        } as any;
        const mockEvent = {
            currentTarget: mockElement
        } as any;

        const options: ConfirmOptions = { message: 'test' };
        service.confirm(options, mockEvent);

        expect(options.position).toBeDefined();
        expect(options.position?.top).toBe(10 + window.scrollY);
        expect(options.position?.left).toBe(20 + window.scrollX);
    });
});
