import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UndoToastComponent } from './undo-toast.component';
import { SignalRService } from '../../../../services/signalr.service';
import { CommonModule } from '@angular/common';

describe('UndoToastComponent', () => {
    let component: UndoToastComponent;
    let fixture: ComponentFixture<UndoToastComponent>;
    let mockSignalRService: any;

    beforeEach(async () => {
        mockSignalRService = {
            submitUndoVote: jasmine.createSpy('submitUndoVote')
        };

        await TestBed.configureTestingModule({
            imports: [UndoToastComponent, CommonModule],
            providers: [
                { provide: SignalRService, useValue: mockSignalRService }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(UndoToastComponent);
        component = fixture.componentInstance;
        
        // Mock Input
        component.vote = {
            initiatorName: 'Alice',
            votes: {
                'user1': true,
                'user2': false
            }
        };
        component.currentUserId = 'user1';
        component.totalPlayers = 4;
        
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should calculate yesCount correctly', () => {
        expect(component.yesCount).toBe(1);
    });

    it('should return 0 for yesCount if no votes', () => {
        component.vote = null;
        expect(component.yesCount).toBe(0);
    });

    it('should return correctly for hasVoted', () => {
        expect(component.hasVoted).toBeTrue();
        component.currentUserId = 'user3';
        expect(component.hasVoted).toBeFalse();
    });

    it('should handle null vote in hasVoted', () => {
        component.vote = null;
        expect(component.hasVoted).toBeFalse();
    });

    it('should return correctly for myVote', () => {
        expect(component.myVote).toBeTrue();
        component.vote.votes['user1'] = false;
        expect(component.myVote).toBeFalse();
    });

    it('should handle missing votes in myVote (Hardened)', () => {
        component.vote = { votes: null };
        expect(component.myVote).toBeFalse();
        
        component.vote = null;
        expect(component.myVote).toBeFalse();
    });

    it('should call signalRService.submitUndoVote when castVote is called', () => {
        component.castVote(true);
        expect(mockSignalRService.submitUndoVote).toHaveBeenCalledWith(true);
    });
});
