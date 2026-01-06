
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SushiTrainRulesComponent } from './sushi-train-rules.component';

describe('SushiTrainRulesComponent', () => {
    let component: SushiTrainRulesComponent;
    let fixture: ComponentFixture<SushiTrainRulesComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [SushiTrainRulesComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(SushiTrainRulesComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
