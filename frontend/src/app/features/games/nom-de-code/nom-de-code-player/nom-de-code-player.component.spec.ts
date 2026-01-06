import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NomDeCodePlayerComponent } from './nom-de-code-player.component';

describe('NomDeCodePlayerComponent', () => {
    let component: NomDeCodePlayerComponent;
    let fixture: ComponentFixture<NomDeCodePlayerComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [NomDeCodePlayerComponent]
        })
            .compileComponents();

        fixture = TestBed.createComponent(NomDeCodePlayerComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
