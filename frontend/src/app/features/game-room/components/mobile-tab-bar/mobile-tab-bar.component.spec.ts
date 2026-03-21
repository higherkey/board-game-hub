import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MobileTabBarComponent } from './mobile-tab-bar.component';

describe('MobileTabBarComponent', () => {
    let component: MobileTabBarComponent;
    let fixture: ComponentFixture<MobileTabBarComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [MobileTabBarComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(MobileTabBarComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should emit tabChange event when selectTab is called', () => {
        spyOn(component.tabChange, 'emit');
        component.selectTab('players');
        expect(component.tabChange.emit).toHaveBeenCalledWith('players');
    });
});
