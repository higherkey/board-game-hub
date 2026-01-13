import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CanvasDrawComponent } from './canvas-draw.component';
import { CommonModule } from '@angular/common';

describe('CanvasDrawComponent', () => {
    let component: CanvasDrawComponent;
    let fixture: ComponentFixture<CanvasDrawComponent>;
    let mockCtx: any;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [CanvasDrawComponent, CommonModule]
        }).compileComponents();

        fixture = TestBed.createComponent(CanvasDrawComponent);
        component = fixture.componentInstance;

        // Mock Canvas implementation behavior if needed, or rely on Headless Chrome
        // Ideally we spy on getContext.
        const canvasEl = document.createElement('canvas');
        mockCtx = {
            lineWidth: 0,
            lineCap: '',
            lineJoin: '',
            strokeStyle: '',
            fillStyle: '',
            fillRect: jasmine.createSpy('fillRect'),
            beginPath: jasmine.createSpy('beginPath'),
            moveTo: jasmine.createSpy('moveTo'),
            lineTo: jasmine.createSpy('lineTo'),
            stroke: jasmine.createSpy('stroke'),
            clearRect: jasmine.createSpy('clearRect'),
            drawImage: jasmine.createSpy('drawImage')
        };
        // Stub toDataURL to return a fake string
        spyOn(canvasEl, 'toDataURL').and.returnValue('data:image/png;base64,fake');
        spyOn(canvasEl, 'getContext').and.returnValue(mockCtx);

        // Inject our mock canvas into the component via a spy on the ElementRef or similar?
        // ViewChild is populated by Angular.
        // We can override component.canvasRef.nativeElement in a dirty way after creation but before ngAfterViewInit logic runs fully?
        // Or just let it run real init, then check properties.
        // ChromeHeadless supports Canvas, so we can test real context interactions implicitly or spy on the real one.

        // Let's use real canvas but spy on methods.
    });

    it('should create', () => {
        fixture.detectChanges();
        expect(component).toBeTruthy();
    });

    it('should initialize context settings', () => {
        component.lineWidth = 10;
        component.color = '#ff0000';
        fixture.detectChanges(); // Trigger ngAfterViewInit

        // Access private ctx if feasible or check behavior
        expect(component['ctx']).toBeTruthy();
        expect(component['ctx'].lineWidth).toBe(10);
        expect(component['ctx'].strokeStyle).toBe('#ff0000');
    });

    it('should save to undo stack on init', () => {
        fixture.detectChanges();
        expect(component.undoStack.length).toBe(1);
    });

    it('clear should reset canvas and add to stack', () => {
        fixture.detectChanges();
        component.clear();
        expect(component.undoStack.length).toBe(2);
        // We assume fillRect was called (hard to spy on real context without wrapping)
    });

    it('undo should restore previous state', () => {
        fixture.detectChanges();
        component.clear(); // Stack 2
        component.clear(); // Stack 3 (duplicates okay for this test logic)

        component.undo();
        expect(component.undoStack.length).toBe(2);
    });
});
