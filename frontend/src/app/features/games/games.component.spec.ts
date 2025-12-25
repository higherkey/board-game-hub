import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GamesComponent } from './games.component';
import { GameDataService } from '../../services/game-data.service';
import { of } from 'rxjs';
import { ActivatedRoute, RouterModule } from '@angular/router';

describe('GamesComponent', () => {
  let component: GamesComponent;
  let fixture: ComponentFixture<GamesComponent>;
  let mockGameDataService: any;

  beforeEach(async () => {
    mockGameDataService = {
      loadGames: jasmine.createSpy('loadGames').and.returnValue(of([
        { id: 'Scatterbrain', name: 'Scatterbrain', status: 'Deployed' },
        { id: 'Warships', name: 'Warships', status: 'Backlog' }
      ]))
    };

    await TestBed.configureTestingModule({
      imports: [GamesComponent, RouterModule.forRoot([])], // Use forRoot or testing module
      providers: [
        { provide: GameDataService, useValue: mockGameDataService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(GamesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load and sort games', () => {
    expect(mockGameDataService.loadGames).toHaveBeenCalled();
    expect(component.games.length).toBe(2);
    // Deployed first
    expect(component.games[0].id).toBe('Scatterbrain');
    expect(component.games[1].id).toBe('Warships');
  });
});
