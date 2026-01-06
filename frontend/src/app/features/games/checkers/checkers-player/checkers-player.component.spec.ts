import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CheckersPlayerComponent } from './checkers-player.component';

describe('CheckersPlayerComponent', () => {
    let component: CheckersPlayerComponent;
    let fixture: ComponentFixture<CheckersPlayerComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [CheckersPlayerComponent]
        })
            .compileComponents();

        fixture = TestBed.createComponent(CheckersPlayerComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
