import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DataPrivacy } from './data-privacy';

describe('DataPrivacy', () => {
  let component: DataPrivacy;
  let fixture: ComponentFixture<DataPrivacy>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DataPrivacy]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DataPrivacy);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
