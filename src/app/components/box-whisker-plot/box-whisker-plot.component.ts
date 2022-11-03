import { Component, OnInit } from '@angular/core';
import * as d3 from "d3";
import {FormattedDataEntry} from "./formatted-data-entry";
import {SvgData} from "../Models/svg-data";

@Component({
  selector: 'app-box-whisker-plot',
  templateUrl: './box-whisker-plot.component.html',
  styleUrls: ['./box-whisker-plot.component.css']
})

export class BoxWhiskerPlotComponent implements OnInit {
  public readonly title = 'Bar Chart';
  private data: FormattedDataEntry[] = [];
  private job_titles: string[] = [];
  private svg_data: SvgData = {margin: {top: 65, right: 80, bottom: 40, left: 60}, selector: '#chart', height: 400, width: 600, bgColor: 'none'};

  private formatDate: any = d3.timeFormat('%b %Y'); // Mar 2022
  private formatPercent: any = d3.format(".0%"); // 100%

  // private readonly xScale: d3.ScaleBand<string>;
  // private readonly yScale: d3.ScaleLinear<number, number>;
  private xAxis: d3.Selection<any, any, any, any> | undefined;
  private yAxis: d3.Selection<any, any, any, any> | undefined;
  private svg: d3.Selection<any, any, any, any> | undefined;

  constructor() {

  }

  ngOnInit(): void {
  }

}
