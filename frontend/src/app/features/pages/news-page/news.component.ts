import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

export interface NewsItem {
  version: string;
  date: string;
  title: string;
  badge?: string;
  highlights: string[];
}

@Component({
  selector: 'app-news',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './news.component.html',
  styleUrls: ['./news.component.scss']
})
export class NewsComponent implements OnInit {
  private http = inject(HttpClient);
  newsList = signal<NewsItem[]>([]);
  isLoading = signal(true);

  ngOnInit(): void {
    this.http.get<NewsItem[]>('assets/data/news.json').subscribe({
      next: (data) => {
        this.newsList.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }
}
