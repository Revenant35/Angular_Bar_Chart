import {Component, Input, OnChanges, OnDestroy, OnInit, SimpleChange, SimpleChanges, ViewEncapsulation} from '@angular/core';
import {NgForm} from '@angular/forms';
import {F_Bar_Data_Entry} from "./formatted-bar-data-entry";
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

  // Data Inputs
  @Input() public raw_data: R_DataEntry[];
  @Input() public title: string;
  @Input() public selector: string;

  // Threshold Inputs
  @Input() public min_threshold: number;
  @Input() public medium_threshold: number;
  @Input() public high_threshold: number;
  @Input() public max_threshold: number;

  // Const Lists
  public readonly LEGEND_LABELS: string[];
  public readonly MAIN_COLORS: string[];
  public readonly SECONDARY_COLORS: string[];
  public readonly TEXT_COLORS: string[];

  // Rendering Data
  public bar_data: F_Bar_Data_Entry[];
  public area_data: string[][];
  public break_data: string[];
  public threshold_data: {x: number, y: number[], path: string[]}[];

  public readonly margin: { top: number, left: number, right: number, bottom: number };

  public readonly height: number;
  public readonly width: number;

  public bandWidth: number;
  public paddingWidth: number;

  public readonly xScale: d3.ScaleBand<string>;
  public readonly yScale: d3.ScaleLinear<number, number>;
  public readonly xAxis: d3.Axis<string>;
  public readonly yAxis: d3.Axis<d3.NumberValue>;

  public statisticsVisible: boolean;
  public popupVisible: boolean;

  public svg!: d3.Selection<d3.BaseType, any, any, any>;

  public timeFormat = d3.timeFormat('Week %U, %Y');

  constructor(){
    // Default Values for Inputs
    this.raw_data = [];
    this.title = 'Angle Trend Chart';
    this.selector = '#chart';

    // Default Thresholds for Statistics
    this.min_threshold = -15;
    this.medium_threshold = 30;
    this.high_threshold = 60;
    this.max_threshold = 120;

    // Initializing constant lists
    this.LEGEND_LABELS = ['Low Risk', 'Medium Risk', 'High Risk'];
    this.MAIN_COLORS = ['#60D394', '#fddb8a', '#EE6055'];
    this.SECONDARY_COLORS = ['#b1ffda', '#ffe0a6', '#ffada8'];
    this.TEXT_COLORS = ['#31e181', '#e1ac2c', '#e7483e'];

    // Data Arrays
    this.bar_data = [];
    this.area_data = [];
    this.break_data = [];
    this.threshold_data = [];

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

    // Booleans
    this.statisticsVisible = false;
    this.popupVisible = false;
  }

  ngOnInit(): void {
    // Append this.yAxis to this.svg
    // @ts-ignore
    this.svg.select('.y.axis').call(this.yAxis)
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Update Title
    if (hasChanged('title')) {
      this.title = changes['title'].currentValue;
    }
    // TODO: Implement this
    if(hasChanged('selector')) {
      console.log("ERROR: \'selector\' cannot be changed")
    }

    if (hasChanged('min_threshold')) {
      this.min_threshold = changes['min_threshold'].currentValue;
    }

    if (hasChanged('medium_threshold')) {
      this.medium_threshold = changes['medium_threshold'].currentValue;
    }

    if (hasChanged('high_threshold')) {
      this.high_threshold = changes['high_threshold'].currentValue;
    }

    if (hasChanged('max_threshold')) {
      this.max_threshold = changes['max_threshold'].currentValue;
    }

    // Update Data
    if (hasChanged('raw_data')) {

      this.svg = d3.select(this.selector + ' svg');

      this.raw_data = changes['raw_data'].currentValue;

      if(!isFirstChange('raw_data')){
        // Clear Data
        this.bar_data = [];
        this.area_data = [];
        this.break_data = [];
        this.threshold_data = [];

        // Remove pre-existing DOM elements
        this.svg.select('.x.axis').selectAll().remove();
        this.svg.select('.data').selectAll().remove();
      }

      this.raw_data.sort((a: R_DataEntry, b: R_DataEntry) => getDateFromRawDatum(a).valueOf() - getDateFromRawDatum(b).valueOf());

      let x_domain = this.raw_data.map((datum: R_DataEntry) => this.timeFormat(getDateFromRawDatum(datum)))

      this.xScale.domain(x_domain);

      // Initialize the padding/band widths
      this.bandWidth = this.xScale.bandwidth();
      this.paddingWidth = (this.width - this.margin.left - this.margin.right) / (this.raw_data.length - this.xScale.padding()) * this.xScale.padding();

      for(let datum of this.raw_data){
        const x = this.xScale(this.timeFormat(getDateFromRawDatum(datum))) || 0;
        const y = [this.yScale(0),
          this.yScale(normalizePercentageFromRawDatum(+datum.percent_green, datum)),
          this.yScale(normalizePercentageFromRawDatum(+datum.percent_green + +datum.percent_yellow, datum)),
          this.yScale(1)];
        const raw_means = [datum.mean_green || NaN, datum.mean_yellow || NaN, datum.mean_red || NaN];
        const raw_modes = [datum.mode_green || NaN, datum.mode_yellow || NaN, datum.mode_red || NaN];
        const raw_stds = [datum.std_green || NaN, datum.std_yellow || NaN, datum.std_red || NaN];
        // const count_videos = +datum.count_videos;
        const thresholds = [this.min_threshold, this.medium_threshold, this.high_threshold, this.max_threshold];

        const y_mean = [-1, -1, -1];
        const y_mode = [-1, -1, -1];
        for (let i = 0; i < this.MAIN_COLORS.length; i++) {
          if (raw_means[i]) {
            const pixels_height = y[i] - y[i+1];
            const stats_height = thresholds[i + 1] - thresholds[i];
            y_mean[i] = y[i] - (pixels_height * ((raw_means[i] - thresholds[i]) / stats_height)) - 1;
            if (raw_means[i] < this.min_threshold + 0.1) {
              y_mean[i] = y[i] - (pixels_height * ((this.min_threshold + 0.1 - thresholds[i]) / stats_height)) - 1;
            }
            if (raw_means[i] > this.max_threshold - 0.1) {
              y_mean[i] = y[i] - (pixels_height * ((this.max_threshold - 0.1 - thresholds[i]) / stats_height)) - 1;
            }
          }
          if (raw_modes[i]) {
            const pixels_height = y[i] - y[i+1];
            const stats_height = thresholds[i + 1] - thresholds[i];
            y_mode[i] = y[i] - (pixels_height * ((raw_modes[i] - thresholds[i]) / stats_height)) - 1;
            if (raw_modes[i] < this.min_threshold + 0.1) {
              y_mode[i] = y[i] - (pixels_height * ((this.min_threshold + 0.1 - thresholds[i]) / stats_height)) - 1;
            }
            if (raw_modes[i] > this.max_threshold - 0.1) {
              y_mode[i] = y[i] - (pixels_height * ((this.max_threshold - 0.1 - thresholds[i]) / stats_height)) - 1;
            }
          }
        }

        this.bar_data.push({
          date: getDateFromRawDatum(datum),
          x: x,
          y_bar: y,
          raw_mean: raw_means,
          y_mean: y_mean,
          raw_mode: raw_modes,
          y_mode: y_mode,
          raw_std: raw_stds,
          // count_videos: count_videos,
        });
      }

      for(let datum of this.bar_data){
        const thresholds = [this.min_threshold, this.medium_threshold, this.high_threshold, this.max_threshold];
        const y_text = [datum.y_bar[0] - 3, datum.y_bar[1] + 5, datum.y_bar[2] + 5, datum.y_bar[3] + 13];

        if(y_text[0] - y_text[1] < 16){
          y_text[1] = y_text[0] - 16;
          if(y_text[0] - y_text[2] < 32){
            y_text[2] = y_text[0] - 32;
          }
        }

        if(y_text[2] - y_text[3] < 16){
          y_text[2] = y_text[3] + 16;
          if(y_text[1] - y_text[3] < 32){
            y_text[1] = y_text[3] + 32;
          }
        }

        const threshold_paths = [];
        for(let [i, threshold] of thresholds.entries()){
          const path = d3.path();
          path.moveTo(datum.x + this.bandWidth, datum.y_bar[i]);
          path.lineTo(datum.x + this.bandWidth + 2, y_text[i] - 5);
          path.closePath();
          threshold_paths.push(path.toString());
        }
        this.threshold_data.push({x: datum.x, y: y_text, path: threshold_paths});
      }

      // Create an array of area paths
      for (let i = 0; i < this.bar_data.length - 1; i++) {
        const x = this.bar_data[i].x + this.bandWidth;
        if (incrementWeek(this.bar_data[i].date).getTime() == this.bar_data[i+1].date.getTime()) {
          const pathData = [];

          for (let j = 0; j < this.SECONDARY_COLORS.length; j++) {
            const path = d3.path();
            path.moveTo(x, this.bar_data[i].y_bar[j] - 1);
            path.lineTo(x + this.paddingWidth, this.bar_data[i+1].y_bar[j] - 1);
            path.lineTo(x + this.paddingWidth, this.bar_data[i+1].y_bar[j + 1] - 1);
            path.lineTo(x, this.bar_data[i].y_bar[j + 1] - 1);
            path.closePath();
            pathData.push(path.toString());
          }

          this.area_data.push(pathData);
        } else {
          const x_rad = (this.paddingWidth < 80) ? this.paddingWidth / 8 : 10;
          const x_center = x + (this.paddingWidth / 2);
          const path = d3.path();
          path.moveTo(x_center, this.yScale(0));
          for (let i = 0; i < 16; i++) {
            path.lineTo(x_center + x_rad, this.yScale(0.015625 + (.0625 * i)) - 1);
            path.lineTo(x_center, this.yScale(0.03125 + (.0625 * i)) - 1);
            path.lineTo(x_center - x_rad, this.yScale(0.046875 + (.0625 * i)) - 1);
            path.lineTo(x_center, this.yScale((.0625 * (i + 1))) - 1);
          }
          path.moveTo(x_center, this.yScale(0));
          path.closePath();
          this.break_data.push(path.toString());
        }
      }

      // Append x-axis
      //@ts-ignore
      this.svg.select('.x.axis').call(this.xAxis)
        .selectAll('.tick text')
        .call(wrap);
    }


    // FUNCTIONS
    // Add wrapping to Dates on X Axis
    function wrap(text: d3.Selection<d3.BaseType, unknown, d3.BaseType, any>): void {
      // @ts-ignore
      text.each(function (t: string) {
        let words: string[] = t.split(' ');
        let lineNumber: number = 0;
        let lineHeight: number = 1.1;
        let y: string = text.attr('y');
        let dy: number = parseFloat(text.attr('dy'));
        d3.select(this).text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em").text(words[0]);
        d3.select(this).append('tspan').attr("x", 0).attr("y", y).attr("dy", `${++lineNumber * lineHeight + dy}em`).text(words[1]);
      })
    }

    function hasChanged(property: string): boolean {
      return (changes[property] && changes[property].currentValue);
    }

    function isFirstChange(property: string): boolean {
      if(!hasChanged(property)){
        return false;
      }
      return (changes[property].isFirstChange());
    }

    function getDateFromRawDatum(datum: R_DataEntry): Date {
      const date = new Date(+datum.video_year, 0);
      date.setDate(+datum.video_week * 7);
      return date;
    }

    function normalizePercentageFromRawDatum(percentage: number, datum: R_DataEntry): number {
      if(percentage < 0 || percentage > 1 || !datum){
        return -1;
      }

      return(percentage / (datum.percent_green + datum.percent_yellow + datum.percent_red));
    }

    function incrementWeek(dt: Date): Date {
      let dt_new = new Date(dt);

      dt_new.setDate(dt_new.getDate() + 7);

      return dt_new;
    }
  }

  ngOnDestroy() {
    // Remove pre-existing DOM elements
    this.svg.select('.x.axis').selectAll().remove();
    this.svg.select('.y.axis').selectAll().remove();
    this.svg.select('.data').selectAll().remove();
  }

  public showPopup(event: MouseEvent, datum: F_Bar_Data_Entry, component: WeeklyTrendChartComponent): void {
    event.stopPropagation();

    if(!this.statisticsVisible) {
      return;
    }

    this.svg.select('.popup').attr('transform', `translate(${datum.x - 5 + (this.bandWidth/2)}, 25)`);
    this.svg.selectAll('.popup text').each(function(d, j){
      d3.select(this).text(`
          μ: ${datum.raw_mean[2 - j].toFixed(2).replace("NaN", "N/A")},
          d: ${datum.raw_mode[2 - j].toFixed(2).replace("NaN", "N/A")},
          σ: ${datum.raw_std[2 - j].toFixed(2).replace("NaN", "N/A")}
      `)
    });
    this.popupVisible = true;
  }

  // Hide the popup if the svg is initialized and the selection isn't in the popup
  public hidePopup(): void {
    this.svg.selectAll('.popup text').each(function(d, j){
      d3.select(this).text('');
    });

    this.popupVisible = false;
  }

  public onSubmit(form: NgForm): void {
    let ERROR_FLAG = false;

    if(form.invalid){
      return;
    }

    const new_medium_threshold = parseInt(form.value.medium_threshold)
    const new_high_threshold = parseInt(form.value.high_threshold)

    console.log(form)
    console.log(new_medium_threshold)
    console.log(new_high_threshold)

    if(isNaN(new_medium_threshold)){
      console.error(`ERROR: Medium treshold must be a valid integer`);
      ERROR_FLAG = true;
    }

    if(isNaN(new_high_threshold)){
      console.error(`ERROR: High treshold must be a valid integer`);
      ERROR_FLAG = true;
    }

    if(ERROR_FLAG)
      return;

    if(new_medium_threshold <= this.min_threshold || new_medium_threshold >= this.max_threshold){
      console.error(`ERROR: Medium threshold (${new_medium_threshold}) out of range (${this.min_threshold}, ${this.max_threshold})`);
      ERROR_FLAG = true;
    }

    if(new_high_threshold <= this.min_threshold || new_high_threshold >= this.max_threshold){
      console.error(`ERROR: High threshold (${new_high_threshold}) out of range (${this.min_threshold}, ${this.max_threshold})`);
      ERROR_FLAG = true;
    }

    if(ERROR_FLAG)
      return;

    if(new_medium_threshold >= new_high_threshold){
      console.error(`ERROR: Medium threshold cannot be greater than high threshold`);
      return;
    }

    this.medium_threshold = new_medium_threshold;
    this.high_threshold = new_high_threshold;
    console.log('Success!');
  }
}

