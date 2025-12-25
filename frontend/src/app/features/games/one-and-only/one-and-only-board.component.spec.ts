import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OneAndOnlyBoardComponent } from './one-and-only-board.component';

describe('OneAndOnlyBoardComponent', () => {
    let component: OneAndOnlyBoardComponent;
    let fixture: ComponentFixture<OneAndOnlyBoardComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [OneAndOnlyBoardComponent]
        })
            .compileComponents();

        fixture = TestBed.createComponent(OneAndOnlyBoardComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
