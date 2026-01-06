import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CheckersRulesComponent } from './checkers-rules.component';

describe('CheckersRulesComponent', () => {
    let component: CheckersRulesComponent;
    let fixture: ComponentFixture<CheckersRulesComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [CheckersRulesComponent]
        })
            .compileComponents();

        fixture = TestBed.createComponent(CheckersRulesComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
