import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DeepfakeRulesComponent } from './deepfake-rules.component';

describe('DeepfakeRulesComponent', () => {
    let component: DeepfakeRulesComponent;
    let fixture: ComponentFixture<DeepfakeRulesComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [DeepfakeRulesComponent]
        })
            .compileComponents();

        fixture = TestBed.createComponent(DeepfakeRulesComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
