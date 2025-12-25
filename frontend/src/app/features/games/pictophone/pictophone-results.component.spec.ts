import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PictophoneResultsComponent } from './pictophone-results.component';

describe('PictophoneResultsComponent', () => {
    let component: PictophoneResultsComponent;
    let fixture: ComponentFixture<PictophoneResultsComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [PictophoneResultsComponent]
        })
            .compileComponents();

        fixture = TestBed.createComponent(PictophoneResultsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
