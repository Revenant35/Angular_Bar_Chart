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
  @Input('data') public raw_data: R_DataEntry[];
  @Input ('title') public title: string;
  @Input('selector') public selector: string;

  // Data Arrays
  public readonly data: F_DataEntry[];
  private readonly barData: {bar: number[][], date: string}[];
  private readonly areaData: {barL: number[][], xL: number, barR: number[][], xR: number}[];

  // Screen Settings
  private height: number;
  private width: number;
  private innerHeight: number;
  private innerWidth: number;
  private left: number;
  private top: number;
  private readonly margin: {top: number, left: number, right: number, bottom: number};

  // Scales
  private readonly xScale: d3.ScaleBand<string>;
  private readonly yScale: d3.ScaleLinear<number, number>;

  // Axes
  private readonly xAxis: d3.Axis<string>;
  private readonly yAxis: d3.Axis<d3.NumberValue>;

  // Const Lists
  private readonly MONTHS: string[];
  private readonly angleRanges: string[];
  private readonly labels: string[];

  // Generators
  private main_colorGenerator: d3.ScaleOrdinal<string, unknown>;
  private secondary_colorGenerator: d3.ScaleOrdinal<string, unknown>;
  private readonly stackGenerator: d3.Stack<any, { [key: string]: number; }, string>;

  //TODO: implement Tooltip
  // Tooltip
  // private tooltip: any;

  // Colors
  private readonly main_colors: string[];
  private readonly secondary_colors: string[];

  // SVG Elements
  private svg: d3.Selection<any, any, any, any> | undefined;

  private isInitialized: boolean;

  constructor() {
    // Inputs
    this.raw_data = [];
    this.title = '[Joint Angle]';
    this.selector = '.bar-chart';

    // Data Arrays
    this.data = [];
    this.barData = [];
    this.areaData = [];

    // Screen Settings
    this.height = 320;
    this.width = 960;
    this.innerHeight = 200;
    this.innerWidth = 810;
    this.left = 50;
    this.top = 50;
    this.margin = {top: 75, right: 90, bottom: 45, left: 60};

    // Scales
    this.xScale = d3.scaleBand();
    this.yScale = d3.scaleLinear();

    // Axes
    this.xAxis = d3.axisBottom(this.xScale);
    this.yAxis = d3.axisLeft(this.yScale);

    // Const Lists
    this.MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    this.angleRanges = ['green', 'yellow', 'red'];
    this.labels = ['Safe', 'Mild Risk', 'High Risk'];

    // Generators
    this.main_colorGenerator = d3.scaleOrdinal();
    this.secondary_colorGenerator = d3.scaleOrdinal();
    this.stackGenerator = d3.stack();

    //TODO: implement Tooltip
    // Tooltip
    // private tooltip: any;

    // Colors
    this.main_colors = ['#60D394', '#FFD97D', '#EE6055'];
    this.secondary_colors = ['#BFEDD4', '#FFF3D6', '#F7BBB5'];

    // SVG Elements
    this.svg = undefined;

    this.isInitialized = false;
  }

  ngOnInit(): void {

    // Create SVG in selector
    this.svg = d3.select(this.selector)
      .select('svg')
        .attr('preserveAspectRatio', 'xMinYMin meet')
        .attr('viewBox', '0 0 960 320')

    // Populate Title
    this.svg
      .select('.title')
        .append('text')
        .attr('x', '50%')
        .attr('y', '40px')
        .attr('text-anchor', 'middle')
        .text(this.title);

    // Populate Legend
    this.svg.select('.legend')
      .append('text')
      .attr('x', this.margin.left + this.innerWidth + (this.margin.right/2))
      .attr('y', this.margin.top + (this.innerHeight/2) - 25)
      .style('font-size', '12px')
      .attr('text-anchor', 'middle')
      .text('Legend');

    // Add text/circles to legend
    for(let i = 0; i < 3; i++){
      const g = this.svg.select('.legend').append('g');

      g.append('circle')
        .style('fill', this.main_colors[i])
        .attr('cx', this.width - this.margin.right + 15)
        .attr('cy', this.margin.top + (this.innerHeight/2) + 5 + (15 * (i-1)))
        .attr('r', '.25em')

      g.append('text')
        .attr('x', this.innerWidth + this.margin.left + 24)
        .attr('y', this.margin.top + 6 + (this.innerHeight/2) + 4 +  (15 * (i-1)))
        .text(this.labels[i])
    }

    // Format this.xScale
    this.xScale
      .range([this.margin.left, this.innerWidth + this.margin.left])
      .paddingOuter(0.05)
      .paddingInner(0.333)
      .align(0.5)

    // Format this.yScale
    this.yScale
      .domain([0,1])
      .range([this.innerHeight + this.margin.top, this.margin.top])

    this.svg.append('g')
      .attr('class', 'y label')
      .append("text")
        .attr("text-anchor", "middle")
        .attr("y", 25)
        .attr("x", - this.margin.top - this.innerHeight / 2)
        .attr("transform", "rotate(-90)")
        .text("Angle Percentages")


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

    this.isInitialized = true;

    this.ngOnChanges();
  }

  ngOnChanges(): void {

    // Ensure DOM is ready
    if(!this.isInitialized){
      return
    }

    // Ensure svg is defined
    if(this.svg === undefined)
      this.svg = d3.select(this.selector).select('svg')

    // Clear Data
    this.data.length = 0;
    this.barData.length = 0;
    this.areaData.length = 0;

    // Remove pre-existing DOM elements
    this.svg.select('.x.axis').remove()
    this.svg.select('.y.axis').remove()
    this.svg.select('.data').remove()

    // Format raw data, store in data
    for(let i: number = 0; i < this.raw_data.length; i++){
      const total_percent: number = +this.raw_data[i].percent_green + +this.raw_data[i].percent_yellow + +this.raw_data[i].percent_red;
      this.data.push({
        date: d3.timeFormat('%b %Y')(new Date(+this.raw_data[i].video_year,+this.raw_data[i].video_month-1)),
        green: +this.raw_data[i].percent_green/total_percent,
        yellow: +this.raw_data[i].percent_yellow/total_percent,
        red: +this.raw_data[i].percent_red/total_percent
      });
    }

    // Sort formatted data
    this.data.sort((a: F_DataEntry, b: F_DataEntry) => this.dateToInt(a.date) - this.dateToInt(b.date))

    // Add domain to xScale
    this.xScale
      .domain(this.data.map(a => a.date))

    // Append x-axis
    this.svg
      .append('g')
      .attr('class', 'x axis')
      .attr('transform', `translate(0, ${this.innerHeight + this.margin.top})`)
      .call(this.xAxis)
      .selectAll('.tick text')
      .call(wrap, this.xScale.bandwidth());

    // Append this.yAxis to this.svg
    this.svg.append("g")
      .attr("class", "y axis")
      .attr('transform', `translate(${this.margin.left}, 0)`)
      .call(this.yAxis)

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

    this.svg.append('g').attr('class', 'data')

    // Populate bars on this.svg.select('.data')
    for(let i = 0; i < this.barData.length; i++){
      const col = this.svg.select('.data')
        .append('g')
        .attr('class', 'bar');

      for(let j = 0; j < 3; j++){
        col.append('rect')
          .attr('x', this.xScale(this.barData[i].date) as number )
          .attr('y', this.yScale(this.barData[i].bar[j][1]) - 1 as number)
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

    while(cursor !== this.data[this.data.length - 1].date && i < this.data.length){
      if(cursor !== this.data[i].date){ // Add breaks to the chart
        const col = this.svg.select('.data').append('g');
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
      if(i != this.data.length - 1 && this.incrementMonth(cursor) == this.data[i+1].date){ // Add areas to the chart
        const col = this.svg.select('.data').append('g');
        for(let j: number = 0; j < 3; j++){
          col.append('path')
            .attr('d', () => {
              const path = d3.path();
              path.moveTo(this.areaData[areas].xL + 1, this.yScale(this.areaData[areas].barL[j][0]) - 1);
              path.lineTo(this.areaData[areas].xR - 0.5, this.yScale(this.areaData[areas].barR[j][0]) - 1);
              path.lineTo(this.areaData[areas].xR - 0.5, this.yScale(this.areaData[areas].barR[j][1]) - 1);
              path.lineTo(this.areaData[areas].xL + 1, this.yScale(this.areaData[areas].barL[j][1]) - (j == 0 ? 0.5 : 1));
              path.closePath();
              return path.toString();
            })
            .attr('class', 'area')
            .attr('fill', this.secondary_colors[j])
        }
        areas++;
      }
      cursor = this.incrementMonth(cursor);
      i++;
    }

    // FUNCTIONS
    function wrap(text: { each: (arg0: () => void) => void; }, width: number) {
      text.each(function() {
        //@ts-ignore
        let text: d3.Selection<any, unknown, null, undefined> = d3.select(this);
        let words: string[] = text.text().split(/\s+/).reverse();
        let word;
        let line: string[] = [];
        let lineNumber: number = 0;
        let lineHeight: number = 1.1;
        let y: string = text.attr('y');
        let dy: number = parseFloat(text.attr('dy'));
        let tspan: d3.Selection<SVGTSpanElement, unknown, null, undefined> = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em")

        while (word = words.pop()) {
          line.push(word)
          tspan.text(line.join(" "))
          // @ts-ignore
          if (tspan.node().getComputedTextLength() > width) {
            line.pop()
            tspan.text(line.join(" "))
            line = [word]
            tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", `${++lineNumber * lineHeight + dy}em`).text(word)
          }
        }

      })
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
