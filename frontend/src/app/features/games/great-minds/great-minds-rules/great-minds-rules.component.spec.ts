
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GreatMindsRulesComponent } from './great-minds-rules.component';

describe('GreatMindsRulesComponent', () => {
    let component: GreatMindsRulesComponent;
    let fixture: ComponentFixture<GreatMindsRulesComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [GreatMindsRulesComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(GreatMindsRulesComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
