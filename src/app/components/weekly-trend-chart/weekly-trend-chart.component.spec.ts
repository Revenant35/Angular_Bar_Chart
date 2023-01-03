import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WeeklyTrendChartComponent } from './weekly-trend-chart.component';

describe('WeeklyTrendChartComponent', () => {
  let component: WeeklyTrendChartComponent;
  let fixture: ComponentFixture<WeeklyTrendChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WeeklyTrendChartComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WeeklyTrendChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
