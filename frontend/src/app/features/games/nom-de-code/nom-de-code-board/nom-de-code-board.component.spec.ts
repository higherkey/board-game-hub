import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NomDeCodeBoardComponent } from './nom-de-code-board.component';

describe('NomDeCodeBoardComponent', () => {
    let component: NomDeCodeBoardComponent;
    let fixture: ComponentFixture<NomDeCodeBoardComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [NomDeCodeBoardComponent]
        })
            .compileComponents();

        fixture = TestBed.createComponent(NomDeCodeBoardComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
