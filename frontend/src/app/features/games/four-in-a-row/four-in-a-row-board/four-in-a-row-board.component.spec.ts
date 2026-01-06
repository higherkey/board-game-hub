import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FourInARowBoardComponent } from './four-in-a-row-board.component';

describe('FourInARowBoardComponent', () => {
    let component: FourInARowBoardComponent;
    let fixture: ComponentFixture<FourInARowBoardComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [FourInARowBoardComponent]
        })
            .compileComponents();

        fixture = TestBed.createComponent(FourInARowBoardComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
