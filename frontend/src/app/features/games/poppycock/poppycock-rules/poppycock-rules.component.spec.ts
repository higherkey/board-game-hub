
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PoppycockRulesComponent } from './poppycock-rules.component';

describe('PoppycockRulesComponent', () => {
    let component: PoppycockRulesComponent;
    let fixture: ComponentFixture<PoppycockRulesComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [PoppycockRulesComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(PoppycockRulesComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
