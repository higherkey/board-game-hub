import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IconBoardComponent } from './icon-board.component';

describe('IconBoardComponent', () => {
    let component: IconBoardComponent;
    let fixture: ComponentFixture<IconBoardComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [IconBoardComponent]
        })
            .compileComponents();

        fixture = TestBed.createComponent(IconBoardComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
