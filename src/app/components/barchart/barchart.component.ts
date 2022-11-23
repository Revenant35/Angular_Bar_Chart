import {Component, Input, OnInit, ViewEncapsulation} from '@angular/core';
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

  // Inputs
  @Input('data') public raw_data: R_DataEntry[] = [];
  @Input ('title') public title: string = '[Joint Angle]';
  @Input('selector') public selector: string = '.bar-chart';

  // Data Arrays
  public readonly data: F_DataEntry[] = [];
  private readonly barData: {bar: number[][], date: string}[] = [];
  private readonly areaData: {barL: number[][], xL: number, barR: number[][], xR: number}[] = [];

  // Screen Settings
  private height: number = 0;
  private width: number = 0;
  private innerHeight: number = 0;
  private innerWidth: number = 0;
  private readonly margin: any = {top: 75, right: 90, bottom: 45, left: 60};

  // Scales
  private readonly xScale: d3.ScaleBand<string> = d3.scaleBand();
  private readonly yScale: d3.ScaleLinear<number, number> = d3.scaleLinear();

  // Axes
  private readonly xAxis: d3.Axis<string> = d3.axisBottom(this.xScale);
  private readonly yAxis: d3.Axis<d3.NumberValue> = d3.axisLeft(this.yScale);

  // Const Lists
  private readonly MONTHS: string[] = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  private readonly angleRanges: string[] = ['green', 'yellow', 'red'];
  private readonly labels: string[] = ['Safe', 'Mild Risk', 'High Risk'];

  // Generators
  private main_colorGenerator: d3.ScaleOrdinal<string, unknown> = d3.scaleOrdinal();
  private secondary_colorGenerator: d3.ScaleOrdinal<string, unknown> = d3.scaleOrdinal();
  private readonly stackGenerator: d3.Stack<any, { [key: string]: number; }, string> = d3.stack();

  //TODO: implement Tooltip
  // Tooltip
  // private tooltip: any;

  // Colors
  private main_colors: string[] = ['#60D394', '#FFD97D', '#EE6055'];
  private secondary_colors: string[] = ['#9FE5BE', '#FFE099', '#F2857D'];
  private bgColor: string = '#FFFFFF';

  // SVG Elements
  private svg: d3.Selection<any, any, any, any> | undefined = undefined;
  private svg_data: d3.Selection<any, any, any, any> | undefined = undefined;
  private svg_legend: d3.Selection<any, any, any, any> | undefined = undefined;

  constructor() {}

  ngOnInit(): void {

    // Initialize this.height & this.width from DOM
    this.width = parseInt(d3.select(this.selector).style('width').replace('px', ''));
    this.height = parseInt(d3.select(this.selector).style('height').replace('px', ''));

    // Initialize this.innerHeight & this.innerWidth from DOM
    this.innerWidth = this.width - this.margin.left - this.margin.right;
    this.innerHeight = this.height - this.margin.top - this.margin.bottom;


    // Format this.rawData and place it into this.data
    for(let i: number = 0; i < this.raw_data.length; i++){
      const total_percent: number = +this.raw_data[i].percent_green + +this.raw_data[i].percent_yellow + +this.raw_data[i].percent_red;
      this.data.push({
        date: d3.timeFormat('%b %Y')(new Date(+this.raw_data[i].video_year,+this.raw_data[i].video_month-1)),
        green: +this.raw_data[i].percent_green/total_percent,
        yellow: +this.raw_data[i].percent_yellow/total_percent,
        red: +this.raw_data[i].percent_red/total_percent
      });
    }

    // Sort this.data[]
    this.data.sort((a: F_DataEntry, b: F_DataEntry) => this.dateToInt(a.date) - this.dateToInt(b.date))


    // Create this.svg on this.selector
    this.svg = d3.select(this.selector)
      .append('svg')
        .style('width', this.width)
        .style('height', this.height)
        .style('background-color', this.bgColor)
        .append('g')
          .attr('width', this.innerWidth)
          .attr('height', this.innerHeight)
          .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`)

    //  Add title to this.svg
    this.svg
      .append('text')
        .attr('x', (this.innerWidth / 2))
        .attr('y', 0 - (this.margin.top / 2))
        .attr('text-anchor', 'middle')
        .attr('class', 'title')
        .text(this.title);

    // Add this.svg_legend to this.svg
    this.svg_legend = this.svg.append('g')
        .attr('class', 'legend')

    for(let i = 0; i < 3; i++){
      this.svg_legend
        .append('circle')
          .style('fill', this.main_colors[i])
          .attr('cx', this.innerWidth + 13)
          .attr('cy', this.innerHeight / 2 - 20 * i)
          .attr('r', '.3em')

      this.svg_legend
        .append('text')
          .attr('x', this.innerWidth + 21)
          .attr('y', this.innerHeight / 2 + 4 - 20 * i)
          .text(this.labels[i])
    }


    // Format this.xScale
    this.xScale
      .range([0, this.innerWidth])
      .paddingOuter(0.05)
      .paddingInner(0.333)
      .align(0.5)
      .domain(this.data.map(a => a.date))

    // Format this.yScale
    this.yScale
      .domain([0,1])
      .range([this.innerHeight, 0])

    // Format this.xAxis
    this.xAxis
      .tickSizeInner(8)
      .tickSizeOuter(0)
      .tickPadding(4)
      .offset(-.5)

    // Format this.yAxis
    this.yAxis
      .tickFormat(d3.format(".0%"))
      .tickSizeInner(-this.innerWidth)
      .tickSizeOuter(0)
      .tickPadding(5)
      .offset(-.5)
      .tickValues([.1, .2, .3, .4, .5, .6, .7, .8, .9, 1])


    // Append this.xAxis to this.svg
    this.svg
      .append('g')
        .attr('class', 'x axis')
        .attr('transform', `translate(0, ${this.innerHeight+1})`)
        .call(this.xAxis)

    // Append this.yAxis w/ label to this.svg
    this.svg.append("g")
      .attr("class", "y axis")
      .attr('transform', 'translate(0, 1)')
      .call(this.yAxis)
      .append("text")
        .attr('class', "y label")
        .attr("text-anchor", "middle")
        .attr("y", -this.margin.left / 2 - 10)
        .attr("x", -this.innerHeight / 2 + 8)
        .attr("transform", "rotate(-90)")
        .text("Angle Percentages")


    // TODO: Create Tooltip
    // // TOOLTIP CREATION
    // this.svg
    //   .append("g")
    //     .attr('class', 'tooltip')
    //     .style("position", "relative")
    //     .style("visibility", "hidden")
    //     .append('rect')
    //       .style('width', '100px')
    //       .style('height', '100px')
    //       .style('fill', 'white')
    //       .append('text')
    //         .style('width', '100px')
    //         .style('height', '100px')
    //         .text("NaN");
    //
    // this.tooltip = this.svg.select('.tooltip');

    // .append('div')
      //   .attr('class', 'tooltip')
      //   .style('position', 'absolute')
      //   .style('visibility', 'hidden')
      //   .attr("width", 30)
      //   .attr("height", 20)
      //   .attr("fill", "white")
      //   .style("opacity", 1)
      //   .attr("x", 15)
      //   .attr("dy", "1.2em")
      //   .style("text-anchor", "middle")
      //   .attr("font-size", "12px")
      //   .attr("font-weight", "bold");


    // Create main_color ColorGenerator
    this.main_colorGenerator
      .domain(this.angleRanges)
      .range(this.main_colors)

    // Create secondary_color ColorGenerator
    this.secondary_colorGenerator
      .domain(this.angleRanges)
      .range(this.secondary_colors)

    // Create StackGenerator
    this.stackGenerator
      .keys(this.angleRanges);


    // Generate bars for all items in this.data
    for(let i = 0; i < this.data.length; i++){
      this.barData[i] = {bar: [], date: ''};
      this.barData[i].bar = new Array(3);

      const green = this.data[i].green;
      const yellow = green + this.data[i].yellow;
      const red = yellow + this.data[i].red;

      this.barData[i].bar[0] = [0, green];
      this.barData[i].bar[1] = [green, yellow];
      this.barData[i].bar[2] = [yellow, red];

      this.barData[i].date = this.data[i].date;
    }

    // generate areas for all items with this.data[i] && this.data[i+1]
    for(let i = 0; i < this.data.length-1; i++){
      if(this.incrementMonth(this.data[i].date) === this.data[i+1].date){
        this.areaData.push({
          barL: this.barData[i].bar,
          barR: this.barData[i+1].bar,
          xL: this.xScale(this.data[i].date)! + this.xScale.bandwidth() - 1,
          xR: this.xScale(this.data[i+1].date)! - this.xScale.padding() + 1
        })
      }
    }

    // Create this.svg_data in this.svg
    this.svg_data = this.svg.append('g')
      .attr('class', 'data')

    // Populate bars on this.svg_data
    for(let i = 0; i < this.barData.length; i++){
      const col = this.svg_data.append('g');
      for(let j = 0; j < 3; j++){
        col.append('rect')
          .attr('x', this.xScale(this.barData[i].date) as number )
          .attr('y', this.yScale(this.barData[i].bar[j][1]) as number)
          .attr('height', (this.yScale(this.barData[i].bar[j][0]) - this.yScale(this.barData[i].bar[j][1])) + 'px' as string)
          .attr('width', (this.xScale.bandwidth()) + 'px' as string)
          .attr('fill', this.main_colorGenerator(this.angleRanges[j]) as string)
          .attr('percent', () => {
            if(j == 0){
              return (d3.format(".2%")(this.barData[i].bar[j][1])) as string
            } else {
              return (d3.format(".2%")(this.barData[i].bar[j][1] - this.barData[i].bar[j-1][1])) as string
            }
          });
      }
    }


    let cursor: string = this.data[0].date;
    let i: number = 0, areas = 0;

    while(cursor !== this.data[this.data.length - 1].date){
      if(cursor !== this.data[i].date){ // Add breaks to the chart
          const col = this.svg_data.append('g');
          col.append('path')
              .attr('d', () => {
                const path = d3.path();
                const x_rad: number = this.xScale.bandwidth() * this.xScale.padding()/8
                const x: number = this.xScale(this.decrementMonth(cursor))! + this.xScale.bandwidth() + (this.xScale.bandwidth() / 4);
                path.moveTo(x, this.yScale(0));
                for(let i = 0; i < 16; i++){
                  path.lineTo(x+x_rad, this.yScale(0.015625 + (.0625 * i)));
                  path.lineTo(x, this.yScale(0.03125 + (.0625 * i)));
                  path.lineTo(x-x_rad, this.yScale(0.046875 + (.0625 * i)));
                  path.lineTo(x, this.yScale((.0625 * (i+1))));
                }
                path.moveTo(x, this.yScale(0))
                path.closePath();
                return path.toString();
              })
            .attr('class','break')
          cursor = this.data[i].date;
      }
      if(this.incrementMonth(cursor) == this.data[i+1].date){ // Add areas to the chart
        const col = this.svg_data.append('g');
        for(let j = 0; j < 3; j++){
          col.append('path')
            .attr('d', () => {
              const path = d3.path();
              path.moveTo(this.areaData[areas].xL, this.yScale(this.areaData[areas].barL[j][0]));
              path.lineTo(this.areaData[areas].xR, this.yScale(this.areaData[areas].barR[j][0]));
              path.lineTo(this.areaData[areas].xR, this.yScale(this.areaData[areas].barR[j][1]));
              path.lineTo(this.areaData[areas].xL, this.yScale(this.areaData[areas].barL[j][1]));
              path.closePath();
              return path.toString();
            })
            .attr('stroke', 'none')
            .attr('fill', this.secondary_colors[j])
        }
        areas++;
      }
      cursor = this.incrementMonth(cursor);
      i++;
    }
  }


  // Converts a DateTime to an integer for arithmetic reasons
  // Only precise to the month
  //  String must be of format 'Dec 2021'
  private dateToInt(date: string): number {
    let month: string = date.slice(0, 3)
    let year: number = Number.parseInt(date.slice(4, 8))
    const index: number = this.MONTHS.indexOf(month);

    if(index == -1)
      return -1;

    return year * 12 + index;
  }

  // Increments a string date by 1 month
  //  String must be of format 'Dec 2021'
  private incrementMonth(date: string): string {
    let month: string = date.slice(0, 3)
    let year: number = Number.parseInt(date.slice(4, 8))
    const index: number = this.MONTHS.indexOf(month);

    if(index == -1)
      return 'Jan 1970';

    return (index == 11) ? `${this.MONTHS[0]} ${++year}` : `${this.MONTHS[index+1]} ${year}`;
  }

  // Decrements a string date ('Dec 2021') by 1 month
  //  String must be of format 'Dec 2021'
  private decrementMonth(date: string): string {
    let month: string = date.slice(0, 3)
    let year: number = Number.parseInt(date.slice(4, 8))
    const index: number = this.MONTHS.indexOf(month);

    if(index == -1)
      return 'Jan 1970';

    return (index == 0) ? `${this.MONTHS[11]} ${--year}` : `${this.MONTHS[index-1]} ${year}`;
  }
}
