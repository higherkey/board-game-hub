
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WisecrackRulesComponent } from './wisecrack-rules.component';

describe('WisecrackRulesComponent', () => {
    let component: WisecrackRulesComponent;
    let fixture: ComponentFixture<WisecrackRulesComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [WisecrackRulesComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(WisecrackRulesComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
