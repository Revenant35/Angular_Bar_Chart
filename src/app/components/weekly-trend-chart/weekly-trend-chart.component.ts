import {Component, Input, OnInit, SimpleChange, SimpleChanges, ViewEncapsulation} from '@angular/core';
import {F_DataEntry} from "./formatted-data-entry";
import {R_DataEntry} from "./raw-data-entry";
import * as d3 from 'd3';

@Component({
  selector: 'app-weekly-trend-chart',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './weekly-trend-chart.component.html',
  styleUrls: ['./weekly-trend-chart.component.css']
})

// NOTES:
//    Entries should be kept below 16

export class WeeklyTrendChartComponent implements OnInit {

  // Basic Inputs
  @Input('data') public raw_data: R_DataEntry[];
  @Input('title') public title: string;
  @Input('selector') public selector: string;

  // Thresholds for Statistics
  @Input('Min Threshold') public readonly MIN_THRESHOLD: number;
  @Input('Medium Threshold') public readonly MEDIUM_THRESHOLD: number;
  @Input('High Threshold') public readonly HIGH_THRESHOLD: number;
  @Input('Max Threshold') public readonly MAX_THRESHOLD: number;

  // readonly lists
  public readonly COLOR_NAMES: string[];
  public readonly LEGEND_LABELS: string[];
  public readonly MAIN_COLORS: string[];
  public readonly SECONDARY_COLORS: string[];
  public readonly TEXT_COLORS: string[];

  // Data Array
  public readonly data: F_DataEntry[];
  public readonly bar_path_data: {paths: string[], x: number, datum: F_DataEntry}[];
  public readonly area_path_data: {paths: string[], x: number, datums: F_DataEntry[]}[];
  public readonly break_path_data: {path: string, x: number}[];
  public readonly mode_path_data: {y_arr: number[], x: number, datum: F_DataEntry}[];
  public readonly mean_path_data: {y_arr: number[], x: number, datum: F_DataEntry}[];
  // public readonly std_path_data: {path: string[], x: number, datum: F_DataEntry}[];

  // Margin for the data section
  public margin: { top: number, left: number, right: number, bottom: number };

  // Screen Settings
  public readonly height: number;
  public readonly width: number;

  // Bar & padding widths (-1 until initialized)
  public bandWidth: number;
  public paddingWidth: number;

  // Initialize X Scale
  public readonly xScale: d3.ScaleBand<string>;

  // Initialize Y Scale
  public readonly yScale: d3.ScaleLinear<number, number>;

  // Initialize X Axis
  public readonly xAxis: d3.Axis<string>;

  // Initialize Y Axis
  public readonly yAxis: d3.Axis<d3.NumberValue>;

  public stroke_dasharray: string;

  // Booleans
  public isInitialized: boolean;
  public statisticsVisible: boolean;

  // SVG Elements
  public svg!: d3.Selection<d3.BaseType, any, any, any>;

  public timeFormat = d3.timeFormat('Week %U, %Y');

  constructor(){

    // Basic Inputs
    this.raw_data = [];
    this.title = 'Angle Trend Chart';
    this.selector = '#chart';

    // Thresholds for Statistics
    this.MIN_THRESHOLD = -15;
    this.MEDIUM_THRESHOLD = 30;
    this.HIGH_THRESHOLD = 60;
    this.MAX_THRESHOLD = 120;

    // readonly lists
    this.COLOR_NAMES = ['green', 'yellow', 'red'];
    this.LEGEND_LABELS = ['Low Risk', 'Medium Risk', 'High Risk'];
    this.MAIN_COLORS = ['#60D394', '#fddb8a', '#EE6055'];
    this.SECONDARY_COLORS = ['#b1ffda', '#ffe0a6', '#ffada8'];
    this.TEXT_COLORS = ['#31e181', '#e1ac2c', '#e7483e'];

    // Data Array
    this.data = [];
    this.bar_path_data = [];
    this.area_path_data = [];
    this.break_path_data = [];
    this.mode_path_data = [];
    this.mean_path_data = [];
    // this.std_path_data = [];

    // Margin for the data section
    this.margin = {top: 140, right: 160, bottom: 75, left: 90};

    // Screen Settings
    this.height = 640;
    this.width = 1920;

    // Bar & padding widths (-1 until initialized)
    this.bandWidth = -1;
    this.paddingWidth = -1;

    // Initialize X Scale
    this.xScale = d3.scaleBand()
      .range([this.margin.left, this.width - this.margin.right])
      .paddingInner(0.333)
      .align(0.5);

    // Initialize Y Scale
    this.yScale = d3.scaleLinear()
      .domain([0, 1])
      .range([this.height - this.margin.bottom, this.margin.top]);

    // Initialize X Axis
    this.xAxis = d3.axisBottom(this.xScale)
      .tickSizeInner(8)
      .tickSizeOuter(0)
      .tickPadding(4)
      .offset(-.5);

    // Initialize Y Axis
    this.yAxis = d3.axisLeft(this.yScale)
      .tickFormat(d3.format(".0%"))
      .tickSizeInner(this.margin.left + this.margin.right - this.width)
      .tickSizeOuter(0)
      .tickPadding(5)
      .offset(-.5)
      .tickValues([.1, .2, .3, .4, .5, .6, .7, .8, .9, 1]);

    this.stroke_dasharray = '';

    // Booleans
    this.isInitialized = false;
    this.statisticsVisible = false;
  }

  ngOnInit(): void {
    this.svg = d3.select(this.selector + ' svg')

    if(!this.svg){
      throw new Error('Error, invalid selector');
    }

    this.isInitialized = true;

    this.ngOnChanges({
      data: new SimpleChange(null, this.raw_data, true)
    });
  }

  ngOnChanges(changes: SimpleChanges) {

    // Ensure DOM is ready
    if (!this.isInitialized) {
      return
    }

    // Update Title
    if (changes['title'] && changes['title'].currentValue) {
      this.title = changes['title'].currentValue;
    }

    // Update Data
    if (changes['data'] && changes['data'].currentValue) {

      this.raw_data = changes['data'].currentValue;

      if(!changes['data'].firstChange){
        // Clear Data
        this.data.length = 0;
        this.bar_path_data.length = 0;
        this.area_path_data.length = 0;
        this.break_path_data.length = 0;
        this.mode_path_data.length = 0;
        this.mean_path_data.length = 0;
        // this.std_path_data.length = 0;

        // Remove pre-existing DOM elements
        this.svg.select('.x.axis').selectAll().remove();
        this.svg.select('.y.axis').selectAll().remove();
        this.svg.select('.data').selectAll().remove();
      }

      // Format raw data, store in data
      for (let datum of this.raw_data) {
        const total_percent: number = +datum.percent_green + +datum.percent_yellow + +datum.percent_red;
        const date = new Date(+datum.video_year, 0);
        date.setDate(+datum.video_week * 7);

        this.data.push({
          date: date, // Assume each week is the last of the week (Jan 7, Jan 14,... Dec 29/30)
          lower_divider: +datum.percent_green / total_percent,
          upper_divider: (+datum.percent_green + +datum.percent_yellow) / total_percent,
          means: [datum.mean_green! || NaN, datum.mean_yellow! || NaN, datum.mean_red! || NaN],
          stds: [datum.std_green! || NaN, datum.std_yellow! || NaN, datum.std_red! || NaN],
          modes: [datum.mode_green! || NaN, datum.mode_yellow! || NaN, datum.mode_red! || NaN],
          count_videos: +datum.count_videos
        });
      }

      // Sort formatted data
      this.data.sort((a: F_DataEntry, b: F_DataEntry) => a.date.valueOf() - b.date.valueOf())

      // Add domain to xScale
      this.xScale
        .domain(this.data.map(a => this.timeFormat(a.date)))

      // Append x-axis
      //@ts-ignore
      this.svg.select('.x.axis').call(this.xAxis)
        .selectAll('.tick text')
        .call(wrap);

      // Append this.yAxis to this.svg
      // @ts-ignore
      this.svg.select('.y.axis').call(this.yAxis)

      // Initialize the padding/band widths
      this.bandWidth = this.xScale.bandwidth();
      this.paddingWidth = (this.width - this.margin.left - this.margin.right) / (this.data.length - this.xScale.padding()) * this.xScale.padding();

      this.stroke_dasharray = Math.floor(0.1 * this.bandWidth) + 'px'

      // Create an array of rectangle paths
      for (let datum of this.data) {
        const bars: string[] = [];
        const x = this.xScale(this.timeFormat(datum.date))!;
        const dividers = [this.yScale(0), this.yScale(datum.lower_divider), this.yScale(datum.upper_divider), this.yScale(1)];
        for (let j = 0; j < this.MAIN_COLORS.length; j++) {
          const path = d3.path();
          path.moveTo(x, dividers[j] - 1);
          path.lineTo(x + this.bandWidth, dividers[j] - 1);
          path.lineTo(x + this.bandWidth, dividers[j + 1] - 1);
          path.lineTo(x, dividers[j + 1] - 1);
          path.closePath();
          bars.push(path.toString());
        }
        this.bar_path_data.push({paths: bars, x: x, datum: datum});
      }

      // Create an array of paths for modes
      for (let datum of this.data) {
        const modes: string[] = ["", "", ""];
        const mode_heights: number[] = [-1, -1, -1];
        const x = this.xScale(this.timeFormat(datum.date))!;
        const dividers = [this.yScale(0), this.yScale(datum.lower_divider), this.yScale(datum.upper_divider), this.yScale(1)];
        const THRESHOLDS = [this.MIN_THRESHOLD, this.MEDIUM_THRESHOLD, this.HIGH_THRESHOLD, this.MAX_THRESHOLD];
        for (let i = 0; i < this.MAIN_COLORS.length; i++) {
          if (datum.modes[i]) {
            const pixels_height = dividers[i] - dividers[i + 1];
            const stats_height = THRESHOLDS[i + 1] - THRESHOLDS[i];
            mode_heights[i] = dividers[i] - (pixels_height * ((datum.modes[i] - THRESHOLDS[i]) / stats_height)) - 1;
            if (datum.means[i] < this.MIN_THRESHOLD + 0.1) {
              mode_heights[i] = dividers[i] - (pixels_height * ((this.MIN_THRESHOLD + 0.1 - THRESHOLDS[i]) / stats_height)) - 1;
            }
            if (datum.modes[i] > this.MAX_THRESHOLD - 0.1) {
              mode_heights[i] = dividers[i] - (pixels_height * ((this.MAX_THRESHOLD - 0.1 - THRESHOLDS[i]) / stats_height)) - 1;
            }
          }
        }
        this.mode_path_data.push({y_arr: mode_heights, x: x, datum: datum});
      }

      // Create an array of paths for means
      for (let datum of this.data) {
        const mean_heights: number[] = [-1, -1, -1];
        const x = this.xScale(this.timeFormat(datum.date))!;
        const dividers = [this.yScale(0), this.yScale(datum.lower_divider), this.yScale(datum.upper_divider), this.yScale(1)];
        const THRESHOLDS = [this.MIN_THRESHOLD, this.MEDIUM_THRESHOLD, this.HIGH_THRESHOLD, this.MAX_THRESHOLD];
        for (let i = 0; i < this.MAIN_COLORS.length; i++) {
          if (datum.means[i]) {
            const pixels_height = dividers[i] - dividers[i + 1];
            const stats_height = THRESHOLDS[i + 1] - THRESHOLDS[i];
            mean_heights[i] = dividers[i] - (pixels_height * ((datum.means[i] - THRESHOLDS[i]) / stats_height)) - 1;
            if (datum.means[i] < this.MIN_THRESHOLD + 0.1) {
              mean_heights[i] = dividers[i] - (pixels_height * ((this.MIN_THRESHOLD + 0.1 - THRESHOLDS[i]) / stats_height)) - 1;
            }
            if (datum.modes[i] > this.MAX_THRESHOLD - 0.1) {
              mean_heights[i] = dividers[i] - (pixels_height * ((this.MAX_THRESHOLD - 0.1 - THRESHOLDS[i]) / stats_height)) - 1;
            }
          }
        }
        this.mean_path_data.push({y_arr: mean_heights, x: x, datum: datum});
      }


      // Create an array of area paths
      for (let i = 0; i < this.data.length - 1; i++) {
        const x = this.xScale(this.timeFormat(this.data[i].date))! + this.bandWidth;
        if (incrementWeek(this.data[i].date).getTime() == this.data[i + 1].date.getTime()) {
          const left_dividers = [this.yScale(0), this.yScale(this.data[i].lower_divider), this.yScale(this.data[i].upper_divider), this.yScale(1)];
          const right_dividers = [this.yScale(0), this.yScale(this.data[i + 1].lower_divider), this.yScale(this.data[i + 1].upper_divider), this.yScale(1)];
          const paths = [];

          for (let j = 0; j < this.SECONDARY_COLORS.length; j++) {
            const path = d3.path();
            path.moveTo(x, left_dividers[j] - 1);
            path.lineTo(x + this.paddingWidth, right_dividers[j] - 1);
            path.lineTo(x + this.paddingWidth, right_dividers[j + 1] - 1);
            path.lineTo(x, left_dividers[j + 1] - 1);
            path.closePath();
            paths.push(path.toString());
          }

          this.area_path_data.push({paths: paths, x: x, datums: [this.data[i], this.data[i + 1]]});
        } else {
          const path = d3.path();
          const x_rad = this.paddingWidth / 8;
          const x_center = x + (this.paddingWidth / 2);
          path.moveTo(x_center, this.yScale(0));
          for (let i = 0; i < 16; i++) {
            path.lineTo(x_center + x_rad, this.yScale(0.015625 + (.0625 * i)) - 1);
            path.lineTo(x_center, this.yScale(0.03125 + (.0625 * i)) - 1);
            path.lineTo(x_center - x_rad, this.yScale(0.046875 + (.0625 * i)) - 1);
            path.lineTo(x_center, this.yScale((.0625 * (i + 1))) - 1);
          }
          path.moveTo(x_center, this.yScale(0));
          path.closePath();

          this.break_path_data.push({path: path.toString(), x: x_center});
        }
      }
    }


    // FUNCTIONS
    // Add wrapping to Dates on X Axis
    function wrap(text: d3.Selection<d3.BaseType, unknown, d3.BaseType, any>): void {
      // @ts-ignore
      text.each(function (t: string) {
        let words: string[] = t.split(', ');
        let lineNumber: number = 0;
        let lineHeight: number = 1.1;
        let y: string = text.attr('y');
        let dy: number = parseFloat(text.attr('dy'));
        d3.select(this).text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em").text(words[0] + ',');
        d3.select(this).append('tspan').attr("x", 0).attr("y", y).attr("dy", `${++lineNumber * lineHeight + dy}em`).text(words[1]);
      })
    }

    function incrementWeek(dt: Date): Date {
      let dt_new = new Date(dt);

      dt_new.setDate(dt_new.getDate() + 7);

      return dt_new;
    }
  }

  public showPopup(event: MouseEvent, x: number, datum: F_DataEntry, component: WeeklyTrendChartComponent): void {
    if(this.isInitialized){
      this.svg.select('.popup').attr('transform', `translate(${x - 5 + (this.bandWidth/2)}, 25)`);
      this.svg.selectAll('.popup text').style('visibility', 'visible').each(function(d, j){
        d3.select(this).text(`
            μ: ${datum.means[2 - j].toFixed(2)},
            d: ${datum.modes[2 - j].toFixed(2)},
            σ: ${datum.stds[2 - j].toFixed(2)}`
        )
      });
      event.stopPropagation();
      this.svg.selectAll('.popup *').style('visibility', 'visible');
      event.stopPropagation();
    }
  }

  // Hide the popup if the svg is initialized and the selection isn't in the popup
  public hidePopup(event: MouseEvent): void {
    let isPopupSelected: boolean = false;
    if(!this.isInitialized){
      return;
    }

    this.svg.selectAll('.popup *').each(function() {
      if(event.target == this){
        isPopupSelected = true;
      }
    });
    if(!isPopupSelected){
      this.svg.selectAll('.popup *').style('visibility', 'hidden')
    }
  }
}
