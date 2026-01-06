import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DeepfakeRulesComponent } from './deepfake-rules.component';

describe('DeepfakeRulesComponent', () => {
    let component: DeepfakeRulesComponent;
    let fixture: ComponentFixture<DeepfakeRulesComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [DeepfakeRulesComponent]
        })
            .compileComponents();

        fixture = TestBed.createComponent(DeepfakeRulesComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should emit rulesClose when clicking the overlay', () => {
        spyOn(component.rulesClose, 'emit');
        const overlay = fixture.nativeElement.querySelector('.rules-overlay');
        overlay.click();
        expect(component.rulesClose.emit).toHaveBeenCalled();
    });

    it('should emit rulesClose when pressing Enter on the overlay', () => {
        spyOn(component.rulesClose, 'emit');
        const overlay = fixture.nativeElement.querySelector('.rules-overlay');
        const event = new KeyboardEvent('keydown', { key: 'Enter' });
        overlay.dispatchEvent(event);
        expect(component.rulesClose.emit).toHaveBeenCalled();
    });

    it('should emit rulesClose when pressing Space on the overlay', () => {
        spyOn(component.rulesClose, 'emit');
        const overlay = fixture.nativeElement.querySelector('.rules-overlay');
        const event = new KeyboardEvent('keydown', { key: 'Space' });
        overlay.dispatchEvent(event);
        expect(component.rulesClose.emit).toHaveBeenCalled();
    });

    it('should NOT emit rulesClose when clicking the card (event propagation should be stopped)', () => {
        spyOn(component.rulesClose, 'emit');
        const card = fixture.nativeElement.querySelector('.rules-card');
        card.click();
        expect(component.rulesClose.emit).not.toHaveBeenCalled();
    });
});
