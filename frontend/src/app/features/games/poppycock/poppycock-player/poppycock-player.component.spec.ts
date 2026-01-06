import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PoppycockPlayerComponent } from './poppycock-player.component';
import { FormsModule } from '@angular/forms';

describe('PoppycockPlayerComponent', () => {
    let component: PoppycockPlayerComponent;
    let fixture: ComponentFixture<PoppycockPlayerComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [PoppycockPlayerComponent, FormsModule]
        })
            .compileComponents();

        fixture = TestBed.createComponent(PoppycockPlayerComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
