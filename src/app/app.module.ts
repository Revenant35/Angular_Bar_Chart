import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { BarchartComponent } from './components/barchart/barchart.component';
import { BoxWhiskerPlotComponent } from './components/box-whisker-plot/box-whisker-plot.component';

@NgModule({
  declarations: [
    AppComponent,
    BarchartComponent,
    BoxWhiskerPlotComponent,
  ],
  imports: [
    BrowserModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
