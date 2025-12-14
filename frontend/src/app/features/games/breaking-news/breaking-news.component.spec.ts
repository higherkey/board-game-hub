import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BreakingNewsComponent } from './breaking-news.component';

describe('BreakingNewsComponent', () => {
  let component: BreakingNewsComponent;
  let fixture: ComponentFixture<BreakingNewsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BreakingNewsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BreakingNewsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
