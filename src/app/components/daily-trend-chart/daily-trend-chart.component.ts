import {Component, Input, OnInit, SimpleChange, SimpleChanges, ViewEncapsulation} from '@angular/core';
import {F_DataEntry} from "./formatted-data-entry";
import {R_DataEntry} from "./raw-data-entry";
import * as d3 from 'd3';

@Component({
  selector: 'app-daily-trend-chart',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './daily-trend-chart.component.html',
  styleUrls: ['./daily-trend-chart.component.css']
})

// NOTES:
//    Entries should be kept below 16

export class DailyTrendChartComponent implements OnInit {

  // Data Inputs
  @Input('raw_data') public raw_data: R_DataEntry[];
  @Input('title') public title: string;
  @Input('selector') public selector: string;

  // Threshold Inputs
  @Input('min_threshold') public min_threshold: number;
  @Input('medium_threshold') public medium_threshold: number;
  @Input('high_threshold') public high_threshold: number;
  @Input('max_threshold') public max_threshold: number;

  // Const Lists
  public readonly LEGEND_LABELS: string[];
  public readonly MAIN_COLORS: string[];
  public readonly SECONDARY_COLORS: string[];
  public readonly TEXT_COLORS: string[];

  public readonly data: F_DataEntry[];

  // Rendering data (sent to HTML)
  public y2_Axis_render_data: {y_arr: number[], height: number[], x: number, width: number};
  public readonly bar_render_data: {y: number[], height: number[], x: number, width: number, datum: F_DataEntry}[];
  public readonly area_path_data: {paths: string[], x: number, datums: F_DataEntry[]}[];
  public readonly break_path_data: {path: string, x: number}[];
  public readonly mode_render_data: {y_arr: number[], x1: number, x2: number, datum: F_DataEntry}[];
  public readonly mean_render_data: {y_arr: number[], x1: number, x2: number, datum: F_DataEntry}[];

  public readonly margin: { top: number, left: number, right: number, bottom: number };

  public readonly height: number;
  public readonly width: number;

  private bandWidth: number;
  private paddingWidth: number;

  public readonly xScale: d3.ScaleBand<string>;
  public readonly y1Scale: d3.ScaleLinear<number, number>;
  public readonly y2Scale: d3.ScaleLinear<number, number>;
  public readonly xAxis: d3.Axis<string>;
  public readonly y1Axis: d3.Axis<d3.NumberValue>;
  public readonly y2Axis: d3.Axis<d3.NumberValue>;

  public isInitialized: boolean;
  public statisticsVisible: boolean;
  public popupVisible: boolean;

  public svg!: d3.Selection<d3.BaseType, any, any, any>;

  public timeFormat = d3.timeFormat('%b %d, %Y');

  constructor(){
    // Basic Inputs
    this.raw_data = [];
    this.title = 'Angle Trend Chart';
    this.selector = '#chart';

    // Thresholds for Statistics
    this.min_threshold = -15;
    this.medium_threshold = 30;
    this.high_threshold = 60;
    this.max_threshold = 120;

    // readonly lists
    this.LEGEND_LABELS = ['Low Risk', 'Medium Risk', 'High Risk'];
    this.MAIN_COLORS = ['#60D394', '#fddb8a', '#EE6055'];
    this.SECONDARY_COLORS = ['#b1ffda', '#ffe0a6', '#ffada8'];
    this.TEXT_COLORS = ['#31e181', '#e1ac2c', '#e7483e'];

    // Data Array
    this.data = [];
    this.bar_render_data = [];
    this.area_path_data = [];
    this.break_path_data = [];
    this.mode_render_data = [];
    this.mean_render_data = [];
    // this.std_path_data = [];

    // Margin for the data section
    this.margin = {top: 140, right: 200, bottom: 75, left: 90};

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
    this.y1Scale = d3.scaleLinear()
      .domain([0, 1])
      .range([this.height - this.margin.bottom, this.margin.top]);

    // Initialize Y Scale
    this.y2Scale = d3.scaleLinear()
      .domain([1, 4])
      .range([this.height - this.margin.bottom, this.margin.top]);

    // Initialize X Axis
    this.xAxis = d3.axisBottom(this.xScale)
      .tickSizeInner(8)
      .tickSizeOuter(0)
      .tickPadding(4)
      .offset(-.5);

    // Initialize Y Axis
    this.y1Axis = d3.axisLeft(this.y1Scale)
      .tickFormat(d3.format(".0%"))
      .tickSizeInner(this.margin.left + this.margin.right - this.width)
      .tickSizeOuter(0)
      .tickPadding(5)
      .offset(-.5)
      .tickValues([.1, .2, .3, .4, .5, .6, .7, .8, .9, 1]);

    // Initialize Y Axis
    this.y2Axis = d3.axisRight(this.y2Scale)
      // .tickFormat(d3.format(".0%"))
      .tickSizeInner(10)
      .tickSizeOuter(0)
      .tickPadding(5)
      .offset(-.5)
      .tickValues([1, 2, 3, 4]);

    this.y2_Axis_render_data = {
      y_arr: [
        this.y2Scale(4) - 1,
        this.y2Scale(3) - 1,
        this.y2Scale(2) - 1,
      ],
      height: [
        this.y2Scale(3) - this.y2Scale(4),
        this.y2Scale(2) - this.y2Scale(3),
        this.y2Scale(1) - this.y2Scale(2),
      ],
      x: 0,
      width: 10,
    };

    // Booleans
    this.isInitialized = false;
    this.statisticsVisible = false;
    this.popupVisible = false;
  }

  ngOnInit(): void {}

  ngOnChanges(changes: SimpleChanges): void {

    this.svg = d3.select(this.selector + ' svg')

    this.isInitialized = true;

    // Update Title
    if (changes['title'] && changes['title'].currentValue) {
      this.title = changes['title'].currentValue;
    }

    if (changes['min_threshold'] && changes['min_threshold'].currentValue) {
      this.min_threshold = changes['min_threshold'].currentValue;
    }

    if (changes['medium_threshold'] && changes['medium_threshold'].currentValue) {
      this.medium_threshold = changes['medium_threshold'].currentValue;
    }

    if (changes['high_threshold'] && changes['high_threshold'].currentValue) {
      this.high_threshold = changes['high_threshold'].currentValue;
    }

    if (changes['max_threshold'] && changes['max_threshold'].currentValue) {
      this.max_threshold = changes['max_threshold'].currentValue;
    }


    // Update Data
    if (changes['raw_data'] && changes['raw_data'].currentValue) {

      this.raw_data = changes['raw_data'].currentValue;

      if(!changes['raw_data'].firstChange){
        // Clear Data
        this.data.length = 0;
        this.bar_render_data.length = 0;
        this.area_path_data.length = 0;
        this.break_path_data.length = 0;
        this.mode_render_data.length = 0;
        this.mean_render_data.length = 0;
        // this.std_path_data.length = 0;

        // Remove pre-existing DOM elements
        this.svg.select('.x.axis').selectAll().remove();
        this.svg.select('.y.axis').selectAll().remove();
        this.svg.select('.data').selectAll().remove();
      }

      // Format raw data, store in data
      for (let datum of this.raw_data) {
        const total_percent: number = +datum.percent_green + +datum.percent_yellow + +datum.percent_red;
        this.data.push({
          date: new Date(+datum.video_year, +datum.video_month - 1, +datum.video_date),
          lower_divider: +datum.percent_green / total_percent,
          upper_divider: (+datum.percent_green + +datum.percent_yellow) / total_percent,
          means: [datum.mean_green || NaN, datum.mean_yellow || NaN, datum.mean_red || NaN],
          stds: [datum.std_green || NaN, datum.std_yellow || NaN, datum.std_red || NaN],
          modes: [datum.mode_green || NaN, datum.mode_yellow || NaN, datum.mode_red || NaN],
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

      // Append this.y1Axis to this.svg
      // @ts-ignore
      this.svg.select('.y1.axis').call(this.y1Axis)

      // Append this.y2Axis to this.svg
      // @ts-ignore
      this.svg.select('.y2.axis').call(this.y2Axis)


      // Initialize the padding/band widths
      this.bandWidth = this.xScale.bandwidth();
      this.paddingWidth = (this.width - this.margin.left - this.margin.right) / (this.data.length - this.xScale.padding()) * this.xScale.padding();

      // Create an array of rectangle paths
      for(let datum of this.data) {
        const y = [
          this.y1Scale(datum.lower_divider) - 1,
          this.y1Scale(datum.upper_divider) - 1,
          this.y1Scale(1) - 1,
        ];
        const height = [
          this.y1Scale(0) - this.y1Scale(datum.lower_divider),
          this.y1Scale(datum.lower_divider) - this.y1Scale(datum.upper_divider),
          this.y1Scale(datum.upper_divider) - this.y1Scale(1),
        ];
        const x = this.xScale(this.timeFormat(datum.date))!;
        const width = this.bandWidth;
        this.bar_render_data.push({y: y, height: height, x: x, width: width, datum: datum});
      }

      // Create an array of paths for modes
      for (let datum of this.data) {
        const mode_heights: number[] = [-1, -1, -1];
        const x = this.xScale(this.timeFormat(datum.date))!;
        const dividers = [this.y1Scale(0), this.y1Scale(datum.lower_divider), this.y1Scale(datum.upper_divider), this.y1Scale(1)];
        const THRESHOLDS = [this.min_threshold, this.medium_threshold, this.high_threshold, this.max_threshold];
        for (let i = 0; i < this.MAIN_COLORS.length; i++) {
          if (datum.modes[i]) {
            const pixels_height = dividers[i] - dividers[i + 1];
            const stats_height = THRESHOLDS[i + 1] - THRESHOLDS[i];
            mode_heights[i] = dividers[i] - (pixels_height * ((datum.modes[i] - THRESHOLDS[i]) / stats_height)) - 1;
            if (datum.means[i] < this.min_threshold + 0.1) {
              mode_heights[i] = dividers[i] - (pixels_height * ((this.min_threshold + 0.1 - THRESHOLDS[i]) / stats_height)) - 1;
            }
            if (datum.modes[i] > this.max_threshold - 0.1) {
              mode_heights[i] = dividers[i] - (pixels_height * ((this.max_threshold - 0.1 - THRESHOLDS[i]) / stats_height)) - 1;
            }
          }
        }
        this.mode_render_data.push({y_arr: mode_heights, x1: x, x2: x+this.bandWidth, datum: datum});
      }

      // Create an array of paths for means
      for (let datum of this.data) {
        const mean_heights: number[] = [-1, -1, -1];
        const x = this.xScale(this.timeFormat(datum.date))!;
        const dividers = [this.y1Scale(0), this.y1Scale(datum.lower_divider), this.y1Scale(datum.upper_divider), this.y1Scale(1)];
        const THRESHOLDS = [this.min_threshold, this.medium_threshold, this.high_threshold, this.max_threshold];
        for (let i = 0; i < this.MAIN_COLORS.length; i++) {
          if (datum.means[i]) {
            const pixels_height = dividers[i] - dividers[i + 1];
            const stats_height = THRESHOLDS[i + 1] - THRESHOLDS[i];
            mean_heights[i] = dividers[i] - (pixels_height * ((datum.means[i] - THRESHOLDS[i]) / stats_height)) - 1;
            if (datum.means[i] < this.min_threshold + 0.1) {
              mean_heights[i] = dividers[i] - (pixels_height * ((this.min_threshold + 0.1 - THRESHOLDS[i]) / stats_height)) - 1;
            }
            if (datum.modes[i] > this.max_threshold - 0.1) {
              mean_heights[i] = dividers[i] - (pixels_height * ((this.max_threshold - 0.1 - THRESHOLDS[i]) / stats_height)) - 1;
            }
          }
        }
        this.mean_render_data.push({y_arr: mean_heights, x1: x, x2: x+this.bandWidth, datum: datum});
      }

      // Create an array of area paths
      for(let i=0; i < this.data.length-1; i++) {
        const x = this.xScale(this.timeFormat(this.data[i].date))! + this.bandWidth;
        if(increment(this.data[i].date).getTime() == this.data[i+1].date.getTime()) {
          const left_dividers = [this.y1Scale(0), this.y1Scale(this.data[i].lower_divider), this.y1Scale(this.data[i].upper_divider), this.y1Scale(1)];
          const right_dividers = [this.y1Scale(0), this.y1Scale(this.data[i+1].lower_divider), this.y1Scale(this.data[i+1].upper_divider), this.y1Scale(1)];
          const paths = [];

          for(let j = 0; j < this.SECONDARY_COLORS.length; j++){
            const path = d3.path();
            path.moveTo(x, left_dividers[j] - 1);
            path.lineTo(x + this.paddingWidth, right_dividers[j] - 1);
            path.lineTo(x + this.paddingWidth, right_dividers[j+1] - 1);
            path.lineTo(x, left_dividers[j+1] - 1);
            path.closePath();
            paths.push(path.toString());
          }

          this.area_path_data.push({paths: paths, x: x, datums: [this.data[i], this.data[i+1]]});
        } else {
          const path = d3.path();
          const x_rad = this.paddingWidth / 8;
          const x_center = x + (this.paddingWidth / 2);
          path.moveTo(x_center, this.y1Scale(0));
          for (let i = 0; i < 16; i++) {
            path.lineTo(x_center + x_rad, this.y1Scale(0.015625 + (.0625 * i)) - 1);
            path.lineTo(x_center, this.y1Scale(0.03125 + (.0625 * i)) - 1);
            path.lineTo(x_center - x_rad, this.y1Scale(0.046875 + (.0625 * i)) - 1);
            path.lineTo(x_center, this.y1Scale((.0625 * (i + 1))) - 1);
          }
          path.moveTo(x_center, this.y1Scale(0));
          path.closePath();

          this.break_path_data.push({path: path.toString(), x: x_center});
        }
      }

      this.svg.selectAll('.y2.axis text').text((d, i) => {
        return ([this.min_threshold, this.medium_threshold, this.high_threshold, this.max_threshold][i] + '°');
      });
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

    function increment(dt: Date): Date {
        let dt_new = new Date(dt);

        dt_new.setDate(dt.getDate() + 1);

        return dt_new;
    }
  }

  public showPopup(event: MouseEvent, x: number, datum: F_DataEntry, component: DailyTrendChartComponent): void {
    event.stopPropagation();

    if(!this.isInitialized || !this.statisticsVisible) {
      return;
    }

    this.svg.select('.popup').attr('transform', `translate(${x - 5 + (this.bandWidth/2)}, 25)`);
    this.svg.selectAll('.popup text').each(function(d, j){
      d3.select(this).text(`
          μ: ${datum.means[2 - j].toFixed(2).replace("NaN", "N/A")},
          d: ${datum.modes[2 - j].toFixed(2).replace("NaN", "N/A")},
          σ: ${datum.stds[2 - j].toFixed(2).replace("NaN", "N/A")}
      `)
    });
    this.popupVisible = true;
  }

  // Hide the popup if the svg is initialized and the selection isn't in the popup
  public hidePopup(): void {
    if(!this.isInitialized){
      return;
    }

    this.svg.selectAll('.popup text').each(function(d, j){
      d3.select(this).text('');
    });

    this.popupVisible = false;
  }
}
