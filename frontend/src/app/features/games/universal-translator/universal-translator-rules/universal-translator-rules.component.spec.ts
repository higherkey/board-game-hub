
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UniversalTranslatorRulesComponent } from './universal-translator-rules.component';

describe('UniversalTranslatorRulesComponent', () => {
    let component: UniversalTranslatorRulesComponent;
    let fixture: ComponentFixture<UniversalTranslatorRulesComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [UniversalTranslatorRulesComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(UniversalTranslatorRulesComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
