import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CheckersBoardComponent } from './checkers-board.component';

describe('CheckersBoardComponent', () => {
    let component: CheckersBoardComponent;
    let fixture: ComponentFixture<CheckersBoardComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [CheckersBoardComponent]
        })
            .compileComponents();

        fixture = TestBed.createComponent(CheckersBoardComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
