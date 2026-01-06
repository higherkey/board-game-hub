import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OneAndOnlyRulesComponent } from './one-and-only-rules.component';

describe('OneAndOnlyRulesComponent', () => {
    let component: OneAndOnlyRulesComponent;
    let fixture: ComponentFixture<OneAndOnlyRulesComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [OneAndOnlyRulesComponent]
        })
            .compileComponents();

        fixture = TestBed.createComponent(OneAndOnlyRulesComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
