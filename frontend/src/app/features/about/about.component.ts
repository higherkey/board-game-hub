import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-about',
    standalone: true,
    imports: [CommonModule, RouterModule],
    template: `
    <div class="container py-5">
        <div class="text-center mb-5">
            <h1 class="display-4 text-primary">How to Play</h1>
            <p class="lead text-secondary">Turn your smartphone into the ultimate game controller.</p>
        </div>

        <div class="row align-items-center mb-5">
            <div class="col-md-6 order-md-2">
                 <div class="p-5 bg-surface rounded shadow-sm text-center">
                    <i class="bi bi-tv display-1 text-primary"></i>
                 </div>
            </div>
            <div class="col-md-6 order-md-1">
                <h3 class="text-primary">1. Host on the Big Screen</h3>
                <p class="text-secondary text-lg">
                    Open BoardGameHub on your laptop, TV, or tablet. create a room to get a unique 4-letter code.
                    This screen will show the main game board, timer, and results.
                </p>
            </div>
        </div>

        <div class="row align-items-center mb-5">
            <div class="col-md-6">
                 <div class="p-5 bg-surface rounded shadow-sm text-center">
                    <i class="bi bi-phone display-1 text-accent"></i>
                 </div>
            </div>
            <div class="col-md-6">
                <h3 class="text-primary">2. Join on your Phone</h3>
                <p class="text-secondary text-lg">
                    Players scan a QR code or go to the site and enter the room code. 
                    Their phone becomes their private controller for answering questions, drawing, or voting.
                </p>
            </div>
        </div>

        <div class="text-center mt-5">
            <a routerLink="/" class="btn btn-primary btn-lg">Get Started</a>
        </div>
    </div>
  `
})
export class AboutComponent { }
