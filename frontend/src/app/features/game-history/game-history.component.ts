import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SignalRService } from '../../services/signalr.service';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-game-history',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './game-history.component.html',
  styleUrls: ['./game-history.component.scss']
})
export class GameHistoryComponent implements OnInit {
  history: any[] = [];

  constructor(private signalRService: SignalRService) { }

  ngOnInit(): void {
    this.signalRService.getGameHistory().then(history => this.history = history);
  }
}
