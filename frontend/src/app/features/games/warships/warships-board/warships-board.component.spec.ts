import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WarshipsBoardComponent } from './warships-board.component';

describe('WarshipsBoardComponent', () => {
    let component: WarshipsBoardComponent;
    let fixture: ComponentFixture<WarshipsBoardComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [WarshipsBoardComponent]
        })
            .compileComponents();

        fixture = TestBed.createComponent(WarshipsBoardComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
