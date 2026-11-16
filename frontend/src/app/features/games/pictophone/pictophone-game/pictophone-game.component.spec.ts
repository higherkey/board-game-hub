import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PictophoneGameComponent } from './pictophone-game.component';
import { SignalRService } from '../../../../services/signalr.service';

describe('PictophoneGameComponent', () => {
    let component: PictophoneGameComponent;
    let fixture: ComponentFixture<PictophoneGameComponent>;
    let mockSignalRService: any;

    beforeEach(async () => {
        mockSignalRService = {
            getConnectionId: jasmine.createSpy('getConnectionId').and.returnValue('mock-id'),
            // Add other mocked methods as needed
        };

        await TestBed.configureTestingModule({
            imports: [PictophoneGameComponent],
            providers: [
                { provide: SignalRService, useValue: mockSignalRService }
            ]
        })
            .compileComponents();

        fixture = TestBed.createComponent(PictophoneGameComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

  it('handles rejected room controls without unhandled promises', async () => {
    const failure = new Error('Disconnected');
    const log = spyOn(console, 'error');
    component.room = { code: 'TEST' } as any;
    mockSignalRService.revealPictophoneNext = jasmine.createSpy('revealPictophoneNext').and.rejectWith(failure);
    component.onRevealNext();
    mockSignalRService.starPictophonePage = jasmine.createSpy('starPictophonePage').and.rejectWith(failure);
    component.onStarPage({"bookIndex":0,"pageIndex":1});
    mockSignalRService.pauseGame = jasmine.createSpy('pauseGame').and.rejectWith(failure);
    component.pauseGame();
    mockSignalRService.resumeGame = jasmine.createSpy('resumeGame').and.rejectWith(failure);
    component.resumeGame();
    mockSignalRService.forcePictophoneNext = jasmine.createSpy('forcePictophoneNext').and.rejectWith(failure);
    component.forceNext();
    await Promise.resolve();
    expect(log).toHaveBeenCalledTimes(5);
    expect(log).toHaveBeenCalledWith(failure);
  });
});
