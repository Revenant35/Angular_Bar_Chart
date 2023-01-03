import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DailyTrendChartComponent } from './daily-trend-chart.component';

describe('DailyTrendChartComponent', () => {
  let component: DailyTrendChartComponent;
  let fixture: ComponentFixture<DailyTrendChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DailyTrendChartComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DailyTrendChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
