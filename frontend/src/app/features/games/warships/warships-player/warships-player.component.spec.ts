import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WarshipsPlayerComponent } from './warships-player.component';

describe('WarshipsPlayerComponent', () => {
    let component: WarshipsPlayerComponent;
    let fixture: ComponentFixture<WarshipsPlayerComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [WarshipsPlayerComponent]
        })
            .compileComponents();

        fixture = TestBed.createComponent(WarshipsPlayerComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
