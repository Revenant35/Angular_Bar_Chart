import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { MonthlyTrendChartComponent } from './components/monthly-trend-chart/monthly-trend-chart.component';
import { DailyTrendChartComponent } from './components/daily-trend-chart/daily-trend-chart.component';
import { WeeklyTrendChartComponent } from './components/weekly-trend-chart/weekly-trend-chart.component';

@NgModule({
  declarations: [
    AppComponent,
    MonthlyTrendChartComponent,
    DailyTrendChartComponent,
    WeeklyTrendChartComponent,
  ],
  imports: [
    BrowserModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
