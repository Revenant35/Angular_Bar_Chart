import {Component, OnInit, ViewEncapsulation} from '@angular/core';
import {F_DataEntry} from "./formatted-data-entry";
import {R_DataEntry} from "./raw-data-entry";
import * as d3 from 'd3';

@Component({
  selector: 'app-barchart',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './barchart.component.html',
  styleUrls: ['./barchart.component.css']
})

export class BarchartComponent implements OnInit {
  public data: F_DataEntry[];
  private raw_data: R_DataEntry[];
  private readonly margin: any = {top: 65, right: 80, bottom: 40, left: 60};
  private readonly selector: string = '.bar-chart';
  private height: number;
  private width: number;
  private bgColor: string = 'none';
  private formatDate: any = d3.timeFormat('%b %Y'); // Mar 2022
  private formatPercent: any = d3.format(".0%"); // 100%
  private readonly xScale: d3.ScaleBand<string>;
  private readonly yScale: d3.ScaleLinear<number, number>;
  private xAxis: d3.Selection<any, any, any, any> | undefined;
  private yAxis: d3.Selection<any, any, any, any> | undefined;
  private svg: d3.Selection<any, any, any, any> | undefined;
  private angleRanges: Iterable<string>;
  private colorGenerator: d3.ScaleOrdinal<string, unknown>;
  private readonly stackGenerator: d3.Stack<any, { [key: string]: number; }, string>;
  private stackData: any;
  // private areaStackData: any[];

  constructor() {
    this.width = 600;
    this.height = 400;

    this.data = [];
    this.raw_data = [
      { "video_year": 2021, "video_month": 9, "percent_green": 0.6437994722955145,  "percent_yellow": 0.35620052770448546,  "percent_red": 0},
      { "video_year": 2021, "video_month": 10, "percent_green": 0.33801540552786585, "percent_yellow": 0.24920706841866785,  "percent_red": 0.4127775260534662 },
      { "video_year": 2021, "video_month": 11, "percent_green": 0.39681637293917,    "percent_yellow": 0.549175667993178,    "percent_red": 0.05400795906765208 },
      { "video_year": 2022, "video_month": 1, "percent_green": 0.7893611968653527,  "percent_yellow": 0.1862977914984564,   "percent_red": 0.02434101163619093 },
      { "video_year": 2022, "video_month": 2, "percent_green": 0.27847005683130194, "percent_yellow": 0.19828658857692494,  "percent_red": 0.5232433545917733 },
      { "video_year": 2022, "video_month": 3, "percent_green": 0.6239431856611432,  "percent_yellow": 0.35306053432532974,  "percent_red": 0.022996280013527225 },
    ];

    this.angleRanges = [];
    this.colorGenerator = d3.scaleOrdinal();
    this.stackGenerator = d3.stack();
    // this.areaStackData = [];

    this.formatRawData();

    // Define X-Scale
    this.xScale = d3.scaleBand()
      .padding(0.15)

    // Define Y-Scale
    this.yScale = d3.scaleLinear()
      .domain([0,1])

    // Set depencencies to undefined until we load them
    this.xAxis = undefined;
    this.yAxis = undefined;
    this.svg = undefined;
  }

  ngOnInit(): void {
    this.width = parseInt(d3.select(this.selector).style('width').replace('px', '')) - this.margin.left - this.margin.right;
    this.height = parseInt(d3.select(this.selector).style('height').replace('px', '')) - this.margin.top - this.margin.bottom;

    // SVG CONSTRUCTION
    // Create SVG, Append to (selector)
    this.svg = d3.select(this.selector)
      .append('svg')
        .style('width', this.width + this.margin.left + this.margin.right)
        .style('height', this.height + this.margin.top + this.margin.bottom)
        .style('background-color', this.bgColor)
      .append('g')
        .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`)

    // Add range to xScale
    this.xScale.range([0, this.width])
      .padding(0.3);

    // Add range to yScale
    this.yScale.range([this.height, 0])

    // Extract Range from Data
    const range: string[] = this.getRange();

    // Sort the Data
    this.sortData();

    // Bar Chart Sections (i.e. green, yellow, red, gray)
    this.angleRanges = Object.keys(this.data[0]).slice(1, 5);

    // Add Domain to X Scale
    this.xScale.domain(range)

    // Create ColorGenerator in this.colorGenerator(key)
    this.initColors();

    // Create StackGenerator in this.stackGenerator(data)
    this.initStack();

    // Call Stack Generator on our data
    // @ts-ignore
    this.stackData = this.stackGenerator(this.data)

    this.drawBarChart();
  }

  drawBarChart() {
    const xScale: d3.ScaleBand<string> = this.xScale;
    const yScale: d3.ScaleLinear<number, number> = this.yScale;

    if(this.svg == undefined)
      return;

    // Append X-Axis
    this.xAxis = this.svg.append('g')
      .attr('class', 'axis')
      .attr('transform', `translate(0, ${this.height})`)

    // Add Domain to Axis Labels
    this.xAxis
      .call(d3.axisBottom(this.xScale).tickSizeOuter(0))
      .selectAll('text');

    // Append Y-Axis
    this.yAxis = this.svg.append("g")
      .attr("class", "axis")
      .call(d3.axisLeft(this.yScale).tickFormat(x => `${this.formatPercent(x)}`))
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -5)
      .attr("y", -40)
      .attr("text-anchor", "end")
      .text("Angle Percentages")

    // Append bar plot to svg the bars
    this.svg.append("g")
      .selectAll("g")
      .data(this.stackData)
      .enter().append("g")
      .attr("fill", (d: any) => (this.colorGenerator(d.key)) as string)
      .selectAll("rect")
      .data(function(d: any) { return d; })
      .enter().append("rect")
      .attr("x", (d: any) => (xScale(d.data.date)) as number )
      .attr("y", (d: any) => (yScale(d[1])) as number)
      .attr("height", (d: any) => (yScale(d[0]) - yScale(d[1])) as number)
      .attr("width", this.xScale.bandwidth());
  }

  // drawBarAreaChart() {
  //   this.drawBarChart();
  //
  //   this.stackData.forEach((d: any, i: number) => {
  //     this.areaStackData[i] = [];
  //   })
  // }

  private formatRawData() {
    for(let i: number = 0; i < this.raw_data.length; i++){
      const date: Date = new Date(+this.raw_data[i].video_year,+this.raw_data[i].video_month-1);
      const total_percent: number = +this.raw_data[i].percent_green + +this.raw_data[i].percent_yellow + +this.raw_data[i].percent_red
      const new_green: number = +this.raw_data[i].percent_green/total_percent;
      const new_yellow: number = +this.raw_data[i].percent_yellow/total_percent;
      const new_red: number = +this.raw_data[i].percent_red/total_percent;
      this.data.push({"date": this.formatDate(date), "green": new_green, "yellow": new_yellow, "red": new_red, "gray": 0});
    }

    this.sortData();
    this.FillEmptyMonths();
    this.sortData();
  }


  // Add data to this.colorGenerator()
  private initColors(): void {
    this.colorGenerator
      .domain(this.angleRanges)
      .range(['#54F53E', '#E5F401', '#F55048', '#AAAAAA'])
  }

  // Add data to this.stackGenerator()
  private initStack(): void {
    this.stackGenerator
      .keys(this.angleRanges);
  }

  // Converts a DateTime to an integer for arithmetic reasons
  // Only precise to the month
  private dateToInt(date: Date): number {
    return date.getFullYear() * 12 + date.getMonth();
  }

  // Sort a list of DataEntries based on Date
  // Only precise to the month
  private sortData(){
    this.data.sort((a: F_DataEntry, b: F_DataEntry) => this.dateToInt(new Date(a.date)) - this.dateToInt(new Date(b.date)))
  }

  // Increments a Date by 1 month
  private incrementMonth(date: Date): Date {
    if(date.getMonth() == 11) {
      date.setMonth(0);
      date.setFullYear(date.getFullYear() + 1);
    } else {
      date.setMonth(date.getMonth() + 1);
    }
    return date;
  }

  // Decrements a Date by 1 month
  private decrementMonth(date: Date): Date {
    if(date.getMonth() == 0){
      date.setMonth(11);
      date.setFullYear(date.getFullYear() - 1);
    } else {
      date.setMonth(date.getMonth() - 1);
    }
    return date;
  }

  // Add all Months without any data
  private FillEmptyMonths(){
    let begin: Date, end: Date;
    const new_entries: {index: number, string: string}[] = [];
    for(let i: number = 0; i < this.data.length - 1; i++){
      begin = new Date(this.data[i].date);
      end = new Date(this.data[i+1].date);
      if(this.dateToInt(begin) + 1 != this.dateToInt(end)){
        this.incrementMonth(begin);
        this.decrementMonth(end);
        if(this.dateToInt(begin) == this.dateToInt(end)){
          new_entries.push({index: i+1, string: `${this.formatDate(begin)}`})
        } else {
          new_entries.push({index: i+1, string: `${this.formatDate(begin)}-\n${this.formatDate(end)}`})
        }
      }
    }
    for(let i: number = 0; i < new_entries.length; i++){
      this.data.splice(new_entries[i].index, 0, {
        date: new_entries[i].string,
        green: 0,
        yellow: 0,
        red: 0,
        gray: 1
      });
    }
  }

  // Get the range of the data on data.date
  //  Input: List of Data_Entries
  //  Output: List of formatted dates
  private getRange(): string[] {
    const range: string[] = [];
    for(let i: number = 0; i < this.data.length; i++){
      range.push(this.data[i].date);
    }
    return range;
  }

  // Insert line break for multiple month strings
  // i.e. May 2022 - Aug 2022 -> May 2022 -
  //                            Aug 2022
  private insertLinebreaks(d: string): void {
    const el = d3.select(d);
    const words = d.split('\n');
    el.text('');

    for (let i: number = 0; i < words.length; i++) {
      const tspan = el.append('tspan').text(words[i]);
      if (i > 0)
        tspan.attr('x', 0).attr('dy', '15');
    }
  };
}
