import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FourInARowPlayerComponent } from './four-in-a-row-player.component';

describe('FourInARowPlayerComponent', () => {
    let component: FourInARowPlayerComponent;
    let fixture: ComponentFixture<FourInARowPlayerComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [FourInARowPlayerComponent]
        })
            .compileComponents();

        fixture = TestBed.createComponent(FourInARowPlayerComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
