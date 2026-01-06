import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NomDeCodeRulesComponent } from './nom-de-code-rules.component';

describe('NomDeCodeRulesComponent', () => {
    let component: NomDeCodeRulesComponent;
    let fixture: ComponentFixture<NomDeCodeRulesComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [NomDeCodeRulesComponent]
        })
            .compileComponents();

        fixture = TestBed.createComponent(NomDeCodeRulesComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
