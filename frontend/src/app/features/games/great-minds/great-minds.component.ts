import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SignalRService } from '../../../services/signalr.service';
import { GreatMindsBoardComponent } from './great-minds-board/great-minds-board.component';
import { GreatMindsPlayerComponent } from './great-minds-player/great-minds-player.component';
import { GreatMindsRulesComponent } from './great-minds-rules/great-minds-rules.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-great-minds',
  standalone: true,
  imports: [CommonModule, GreatMindsBoardComponent, GreatMindsPlayerComponent, GreatMindsRulesComponent],
  templateUrl: './great-minds.component.html',
  styleUrls: ['./great-minds.component.scss']
})
export class GreatMindsGameComponent implements OnInit, OnDestroy {
  @Input() isHost: boolean = false;
  gameState: any = null;
  myConnectionId: string = '';
  showRules: boolean = false;

  private subscription: Subscription | null = null;

  constructor(
    private readonly signalR: SignalRService
  ) { }

  ngOnInit() {
    this.myConnectionId = this.signalR.getConnectionId() || '';

    this.subscription = this.signalR.gameState$.subscribe((state: any) => {
      if (state) {
        this.gameState = state;
      }
    });
  }

  ngOnDestroy() {
    if (this.subscription) this.subscription.unsubscribe();
  }
}
