import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FourInARowRulesComponent } from './four-in-a-row-rules.component';

describe('FourInARowRulesComponent', () => {
    let component: FourInARowRulesComponent;
    let fixture: ComponentFixture<FourInARowRulesComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [FourInARowRulesComponent]
        })
            .compileComponents();

        fixture = TestBed.createComponent(FourInARowRulesComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
