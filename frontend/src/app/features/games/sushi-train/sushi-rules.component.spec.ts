
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SushiRulesComponent } from './sushi-rules.component';

describe('SushiRulesComponent', () => {
    let component: SushiRulesComponent;
    let fixture: ComponentFixture<SushiRulesComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [SushiRulesComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(SushiRulesComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
