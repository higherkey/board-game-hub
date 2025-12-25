import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PoppycockBoardComponent } from './poppycock-board.component';

describe('PoppycockBoardComponent', () => {
    let component: PoppycockBoardComponent;
    let fixture: ComponentFixture<PoppycockBoardComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [PoppycockBoardComponent]
        })
            .compileComponents();

        fixture = TestBed.createComponent(PoppycockBoardComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
