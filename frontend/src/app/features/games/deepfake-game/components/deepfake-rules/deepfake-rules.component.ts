import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-deepfake-rules',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="rules-overlay" (click)="rulesClose.emit()">
      <div class="rules-card glassmorphism animate-in" (click)="$event.stopPropagation()">
        <header class="rules-header">
          <h2>Deepfake Rules</h2>
          <button class="close-btn" (click)="rulesClose.emit()">&times;</button>
        </header>

        <main class="rules-body">
          <section class="rule-section">
            <h3><span class="icon">🎭</span> The Roles</h3>
            <div class="role-grid">
              <div class="role-item human">
                <h4>Human Artist</h4>
                <p>Knows the <strong>Secret Prompt</strong>. Draw just enough to prove you know it, but keep it subtle.</p>
              </div>
              <div class="role-item ai">
                <h4>Artificial Intelligence</h4>
                <p>Only knows the <strong>Category</strong>. Mimic others to blend in and try to guess the word!</p>
              </div>
            </div>
          </section>

          <section class="rule-section">
            <h3><span class="icon">✏️</span> Gameplay</h3>
            <ul>
              <li>Players take turns drawing <strong>one continuous stroke</strong>.</li>
              <li>There are <strong>2 complete rounds</strong> of drawing.</li>
              <li>After drawing, everyone votes on who they think is the <strong>AI</strong>.</li>
            </ul>
          </section>

          <section class="rule-section">
            <h3><span class="icon">🏆</span> Winning</h3>
            <div class="win-grid">
              <div class="win-item">
                <h4>Artists Win</h4>
                <p>If the AI is identified AND fails to guess the secret prompt.</p>
              </div>
              <div class="win-item">
                <h4>AI Wins</h4>
                <p>If they escape detection OR if they guess the prompt after being caught.</p>
              </div>
            </div>
          </section>
        </main>

        <footer class="rules-footer">
          <button class="primary-btn" (click)="rulesClose.emit()">Got it!</button>
        </footer>
      </div>
    </div>
  `,
  styles: [`
    .rules-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(4px);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    .glassmorphism {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 20px;
      box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
    }

    .rules-card {
      width: 100%;
      max-width: 600px;
      max-height: 90vh;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      padding: 30px;
    }

    .animate-in {
      animation: slideDown 0.4s ease-out;
    }

    @keyframes slideDown {
      from { transform: translateY(-30px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    .rules-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 25px;
      border-bottom: 2px solid #f0f0f0;
      padding-bottom: 15px;
    }

    .rules-header h2 {
      margin: 0;
      color: #1a1a1a;
      font-size: 24px;
      font-weight: 800;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 32px;
      cursor: pointer;
      color: #999;
      transition: color 0.2s;
    }

    .close-btn:hover {
      color: #333;
    }

    .rule-section {
      margin-bottom: 25px;
    }

    .rule-section h3 {
      font-size: 18px;
      font-weight: 700;
      color: #444;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
    }

    .icon {
      margin-right: 10px;
      font-size: 20px;
    }

    .role-grid, .win-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
    }

    .role-item, .win-item {
      padding: 15px;
      border-radius: 12px;
      background: #f8f9fa;
      border: 1px solid #eee;
    }

    .role-item h4, .win-item h4 {
      margin-top: 0;
      font-size: 16px;
      margin-bottom: 8px;
    }

    .human h4 { color: #2ecc71; }
    .ai h4 { color: #e74c3c; }

    .role-item p, .win-item p, ul li {
      margin: 0;
      font-size: 14px;
      color: #666;
      line-height: 1.5;
    }

    ul {
      padding-left: 20px;
    }

    ul li {
      margin-bottom: 8px;
    }

    .rules-footer {
      display: flex;
      justify-content: center;
      margin-top: 10px;
    }

    .primary-btn {
      background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
      color: white;
      border: none;
      padding: 12px 40px;
      border-radius: 30px;
      font-weight: 700;
      font-size: 16px;
      cursor: pointer;
      box-shadow: 0 4px 15px rgba(99, 102, 241, 0.4);
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .primary-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(99, 102, 241, 0.5);
    }

    @media (max-width: 480px) {
      .role-grid, .win-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class DeepfakeRulesComponent {
  @Output() rulesClose = new EventEmitter<void>();
}
