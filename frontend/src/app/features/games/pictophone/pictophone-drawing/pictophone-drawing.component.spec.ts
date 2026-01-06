import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PictophoneDrawingComponent } from './pictophone-drawing.component';

describe('PictophoneDrawingComponent', () => {
    let component: PictophoneDrawingComponent;
    let fixture: ComponentFixture<PictophoneDrawingComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [PictophoneDrawingComponent]
        })
            .compileComponents();

        fixture = TestBed.createComponent(PictophoneDrawingComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
