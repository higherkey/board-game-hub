import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OneAndOnlyPlayerComponent } from './one-and-only-player.component';
import { FormsModule } from '@angular/forms';

describe('OneAndOnlyPlayerComponent', () => {
    let component: OneAndOnlyPlayerComponent;
    let fixture: ComponentFixture<OneAndOnlyPlayerComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [OneAndOnlyPlayerComponent, FormsModule]
        })
            .compileComponents();

        fixture = TestBed.createComponent(OneAndOnlyPlayerComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
