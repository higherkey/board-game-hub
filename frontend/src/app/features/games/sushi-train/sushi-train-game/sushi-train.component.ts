import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Room, SignalRService } from '../../../../services/signalr.service';
import { SushiTrainBoardComponent } from '../sushi-train-board/sushi-train-board.component';
import { SushiTrainPlayerComponent } from '../sushi-train-player/sushi-train-player.component';

@Component({
    selector: 'app-sushi-train',
    standalone: true,
    imports: [CommonModule, SushiTrainBoardComponent, SushiTrainPlayerComponent],
    templateUrl: './sushi-train.component.html',
    styleUrls: ['./sushi-train.component.scss']
})
export class SushiTrainComponent implements OnInit {
    @Input() room!: Room;
    @Input() myConnectionId: string = '';
    @Input() isHost: boolean = false;

    constructor(private readonly signalRService: SignalRService) { }

    ngOnInit() {
        if (!this.myConnectionId) {
            this.myConnectionId = this.signalRService.getConnectionId() || '';
        }
    }
}
