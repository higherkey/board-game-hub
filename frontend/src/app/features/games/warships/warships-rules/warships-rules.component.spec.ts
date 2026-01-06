import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WarshipsRulesComponent } from './warships-rules.component';

describe('WarshipsRulesComponent', () => {
    let component: WarshipsRulesComponent;
    let fixture: ComponentFixture<WarshipsRulesComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [WarshipsRulesComponent]
        })
            .compileComponents();

        fixture = TestBed.createComponent(WarshipsRulesComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
