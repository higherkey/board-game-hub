import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GameDetailComponent } from './game-detail.component';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { GameDataService } from '../../../services/game-data.service';
import { SignalRService } from '../../../services/signalr.service';

describe('GameDetailComponent', () => {
    let component: GameDetailComponent;
    let fixture: ComponentFixture<GameDetailComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [GameDetailComponent],
            providers: [
                {
                    provide: ActivatedRoute,
                    useValue: {
                        snapshot: { paramMap: { get: () => 'scatterbrain' } }
                    }
                },
                {
                    provide: GameDataService,
                    useValue: { games$: of([]) }
                },
                {
                    provide: SignalRService,
                    useValue: { me$: of('Guest') }
                }
            ]
        })
            .compileComponents();

        fixture = TestBed.createComponent(GameDetailComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
