import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NewsComponent } from './news.component';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

describe('NewsComponent', () => {
  let component: NewsComponent;
  let fixture: ComponentFixture<NewsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewsComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(NewsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the news component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with loading state', () => {
    expect(component.isLoading()).toBeTrue();
  });

  it('should populate newsList and set isLoading to false on successful fetch', () => {
    const mockData = [
      {
        version: 'v0.24.0',
        date: '2026-08-31',
        title: 'Platform Engine Modernization',
        badge: 'Performance',
        highlights: ['Highlight 1', 'Highlight 2']
      }
    ];

    const httpMock = TestBed.inject(HttpTestingController);
    const req = httpMock.expectOne('assets/data/news.json');
    expect(req.request.method).toBe('GET');
    req.flush(mockData);

    expect(component.newsList()).toEqual(mockData);
    expect(component.isLoading()).toBeFalse();
    httpMock.verify();
  });

  it('should set isLoading to false on fetch error', () => {
    const httpMock = TestBed.inject(HttpTestingController);
    const req = httpMock.expectOne('assets/data/news.json');
    req.error(new ProgressEvent('Network error'));

    expect(component.isLoading()).toBeFalse();
    httpMock.verify();
  });
});
