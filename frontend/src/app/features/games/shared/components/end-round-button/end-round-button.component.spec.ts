
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EndRoundButtonComponent } from './end-round-button.component';
import { CommonModule } from '@angular/common';

describe('EndRoundButtonComponent', () => {
    let component: EndRoundButtonComponent;
    let fixture: ComponentFixture<EndRoundButtonComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [EndRoundButtonComponent, CommonModule]
        }).compileComponents();

        fixture = TestBed.createComponent(EndRoundButtonComponent);
        component = fixture.componentInstance;
        // No required inputs
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should emit endRound on click', () => {
        spyOn(component.endRound, 'emit');
        component.handleClick();
        expect(component.endRound.emit).toHaveBeenCalled();
    });
});
