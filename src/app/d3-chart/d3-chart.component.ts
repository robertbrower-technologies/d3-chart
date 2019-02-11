import { Component, ElementRef, EventEmitter, HostListener, Input, Output } from '@angular/core';
import * as d3 from 'd3';
import { D3ChartSeries } from './d3-chart-series';
import { D3ChartDataPoint } from './d3-chart-data-point';
import { D3ChartMouseOverEvent } from './d3-chart-mouse-over-event';
import { D3ChartMouseOutEvent } from './d3-chart-mouse-out-event';
import { D3ChartClickEvent } from './d3-chart-click-event';

export function textSize(text, fontFamily, fontSize) {
  let svg = d3.select('body').append('svg');
  let txt = svg.append('text')
    .attr('x', -99999)
    .attr('y', -99999)
    .attr('font-family', fontFamily)
    .attr('font-size', fontSize)
    .text(text);

  var bBox = svg.node().getBBox();  
  svg.remove();
  return {
    width: bBox.width,
    height: bBox.height
  };
}

@Component({
  selector: 'app-d3-chart',
  templateUrl: './d3-chart.component.html',
  styleUrls: ['./d3-chart.component.css']
})
export class D3ChartComponent {

  _data: Array<D3ChartSeries>;
  get data(): Array<D3ChartSeries> {
    return this._data;
  }

  @Input('data')
  set data(value: Array<D3ChartSeries>) {
    if (value !== this.data) {
      this._data = value;
      this.minY = Math.min(...this._data.map(dataSeries => Math.min(...dataSeries.dataPoints.map(dataPoint => dataPoint.y))));
      this.maxY = Math.max(...this._data.map(dataSeries => Math.max(...dataSeries.dataPoints.map(dataPoint => dataPoint.y))));
      this.buildChart(
        this.xAxistickInterval,
        this.formatXAxisTick,
        this.yAxistickInterval,
        this.formatYAxisTick,
        this.onMouseOver.bind(this),
        this.onMouseOut.bind(this),
        this.onClick.bind(this));
    }
  }

  minY: number;

  maxY: number;

  @Input() xAxistickInterval = 1;

  @Input() yAxistickInterval = 1;

  @Input() formatXAxisTick: Function;

  @Input() formatYAxisTick: Function;

  @Input() chartTitle: string;

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    this.buildChart(
      this.xAxistickInterval,
      this.formatXAxisTick,
      this.yAxistickInterval,
      this.formatYAxisTick,
      this.onMouseOver.bind(this),
      this.onMouseOut.bind(this),
      this.onClick.bind(this));
  }

  @Output() mouseOver = new EventEmitter<D3ChartMouseOverEvent>();

  @Output() mouseOut = new EventEmitter<D3ChartMouseOutEvent>();

  @Output() click = new EventEmitter<D3ChartClickEvent>();
  
  constructor(private elementRef: ElementRef) {}

  buildChart(xAxistickInterval: number, formatXAxisTick: Function, yAxistickInterval: number, formatYAxisTick: Function, onMouseOver: Function, onMouseOut: Function, onClick: Function) {
    const parentWidth = this.elementRef.nativeElement.offsetWidth;
    const parentHeight = this.elementRef.nativeElement.offsetHeight;
    const verticalMargin = 64;
    const horizontalMargin = 128;

    const seriesVerticalMargin = 32;

    const chartWidth = parentWidth - 2 * horizontalMargin;
    const chartHeight = parentHeight - 2 * verticalMargin;
    const seriesHeight = chartHeight / this.data.length - seriesVerticalMargin;

    const host = d3.select(this.elementRef.nativeElement);
    host.selectAll('*').remove();

    const svg = host.append('svg')
      .attr('width', parentWidth)
      .attr('height', parentHeight)
      .html(`
        <defs>
          <filter id="bar" x="0" y="0" width="200%" height="200%">
            <feOffset result="offOut" in="SourceAlpha" dx="2" dy="2" />
            <feGaussianBlur result="blurOut" in="offOut" stdDeviation="3" />
            <feBlend in="SourceGraphic" in2="blurOut" mode="normal" />
          </filter>
          <filter id="series" x="0" y="0" width="200%" height="200%">
            <feOffset result="offOut" in="SourceAlpha" dx="4" dy="4" />
            <feGaussianBlur result="blurOut" in="offOut" stdDeviation="6" />
            <feBlend in="SourceGraphic" in2="blurOut" mode="normal" />
          </filter>
        </defs>
      `);

    const chart = svg.append('rect')
        .attr('x', horizontalMargin)
        .attr('y', verticalMargin)
        .attr('width', chartWidth)
        .attr('height', chartHeight)
        .attr('class', 'chart');
      
    for (let i=0; i<this.data.length; i++) {

      const series = svg.append('rect')
        .attr('x', horizontalMargin)
        .attr('y', verticalMargin + i * (seriesHeight + seriesVerticalMargin))
        .attr('width', chartWidth)
        .attr('height', seriesHeight)
        .attr('class', 'series')
        .attr('filter', 'url(#series)');
      
      let xScale = d3.scaleBand()
        .range([0, chartWidth])
        .domain(this.data[i].dataPoints.map((s) => s.x))
        .padding(0.2);

      let xAxis = d3.axisBottom(xScale)
        .tickValues(xScale.domain().filter(function(d,i){ return !(i % xAxistickInterval)}));
      
      svg.append('g')
        .attr('class', 'axis xaxis')
        .attr('style', 'opacity: 0')  
        .attr('transform', `translate(${horizontalMargin}, ${verticalMargin + seriesHeight + i * (seriesHeight + seriesVerticalMargin)})`)
        .call(xAxis.tickFormat(function(d) {
          return formatXAxisTick(d);
        }));

      let yScale = d3.scaleLinear()
        .range([seriesHeight, 0])
        .domain([this.minY, this.maxY]);

      let yAxis = d3.axisLeft(yScale)
        .tickValues(yScale.domain().filter(function(d,i){ return !(i % yAxistickInterval)}));
      
      svg.append('g')
        .attr('class', 'axis yaxis')
        .attr('style', 'opacity: 0')  
        .attr('transform', `translate(${horizontalMargin}, ${verticalMargin + i * (seriesHeight + seriesVerticalMargin)})`)
        .call(yAxis.tickFormat(function(d) {
          return formatYAxisTick(d);
        }));

      svg.append('g')
        .attr('class', 'axis xgrid')  
        .attr('style', 'opacity: 0')
        .attr('transform', `translate(${horizontalMargin}, ${verticalMargin + i * (seriesHeight + seriesVerticalMargin)})`)
        .call(d3.axisLeft()
          .scale(yScale)
          .tickSize(-chartWidth, 0, 0)
          .tickFormat(''));

      // svg.append('g')
      //   .attr('class', 'axis ygrid')
      //   .attr('style', 'opacity: 0')
      //   .attr('transform', `translate(${horizontalMargin}, ${verticalMargin + seriesHeight + i * (seriesHeight + seriesVerticalMargin)})`)
      //   .call(d3.axisBottom()
      //       .scale(xScale)
      //       .tickSize(-seriesHeight, 0, 0)
      //       .tickFormat(''))

      svg.selectAll()
        .data(this.data[i].dataPoints)
        .enter()
        .append('rect')
        .attr('x', (s) => horizontalMargin + xScale(s.x))
        .attr('y', (s) => verticalMargin + yScale(s.y) + i * (seriesHeight + seriesVerticalMargin))
        .attr('height', (s) => seriesHeight - yScale(s.y))
        .attr('width', xScale.bandwidth())
        .attr('class', 'bar')
        .attr('filter', 'url(#bar)')
        .on('mouseover', function(dataPoint: D3ChartDataPoint, index: number, elements: Array<SVGRectElement>) {

          onMouseOver(i, dataPoint, index, this);

          svg.selectAll('g.xaxis').filter((d, j) => j===i).attr('style', 'opacity: 1');
          svg.selectAll('g.yaxis').filter((d, j) => j===i).attr('style', 'opacity: 1');
          svg.selectAll('g.xgrid').filter((d, j) => j===i).attr('style', 'opacity: 1');
          svg.selectAll('g.ygrid').filter((d, j) => j===i).attr('style', 'opacity: 1');

          d3.select(this)
            .transition()
            .duration(250)
            .attr('opacity', 0.6)
            .attr('x', (a) =>  horizontalMargin + xScale(a.x) - 5)
            .attr('width', xScale.bandwidth() + 10)

          const y = yScale(dataPoint.y)
          const line = svg.append('line')
            .attr('id', 'limit')
            .attr('x1', horizontalMargin)
            .attr('y1', verticalMargin + y + i * (seriesHeight + seriesVerticalMargin))
            .attr('x2', horizontalMargin + chartWidth)
            .attr('y2', verticalMargin + y + i * (seriesHeight + seriesVerticalMargin));
        })
        .on('mouseout', function(dataPoint: D3ChartDataPoint, index: number, elements: Array<SVGRectElement>) {

          onMouseOut(i, dataPoint, index, this);

          svg.selectAll('g.xaxis').filter((d, j) => j===i).attr('style', 'opacity: 0');
          svg.selectAll('g.yaxis').filter((d, j) => j===i).attr('style', 'opacity: 0');
          svg.selectAll('g.xgrid').filter((d, j) => j===i).attr('style', 'opacity: 0');
          svg.selectAll('g.ygrid').filter((d, j) => j===i).attr('style', 'opacity: 0');
          
          d3.select(this)
            .transition()
            .duration(250)
            .attr('opacity', 1)
            .attr('x', (a) => horizontalMargin + xScale(a.x))
            .attr('width', xScale.bandwidth());

          svg.selectAll('#limit').remove()
        })
        .on("click", function(dataPoint: D3ChartDataPoint, index: number, elements: Array<SVGRectElement>) {
          onClick(i, dataPoint, index, this);

          
        });

      let labelSize = textSize(i, 'Open Sans', '12px');

      svg.append('text')
        .attr('font-family', 'Open Sans')
        .attr('font-size', '12px')
        .attr('x', horizontalMargin / 2 - labelSize.width / 2)
        .attr('y', verticalMargin + i * (seriesHeight + seriesVerticalMargin) + seriesHeight / 2 + labelSize.height / 2) // TODO + textSize.height / 2
        // .attr('transform', 'rotate(-90)')
        .attr('text-anchor', 'middle')
        .text(this.data[i].name);
    }

    // svg.append('text')
    //   .attr('x', -(height / 2) - margin)
    //   .attr('y', margin / 2.4)
    //   .attr('transform', 'rotate(-90)')
    //   .attr('text-anchor', 'middle')
    //   .text('Love meter (%)');

    let titleSize = textSize(this.chartTitle, 'Open Sans', '16px');

    svg.append('text')
      .attr('font-family', 'Open Sans')
      .attr('font-size', '24px')
      .attr('x', horizontalMargin + chartWidth / 2)
      .attr('y', verticalMargin / 2 + titleSize.height / 2)
      .attr('text-anchor', 'middle')
      .text(this.chartTitle);
  }

  onMouseOver(seriesIndex: number, dataPoint: D3ChartDataPoint, index: number, element: SVGRectElement) {
    let event = new D3ChartMouseOverEvent();
    event.seriesIndex = seriesIndex;
    event.dataPoint = dataPoint;
    event.dataPointIndex = index;
    event.element = element;
    this.mouseOver.emit(event);
  }

  onMouseOut(seriesIndex: number, dataPoint: D3ChartDataPoint, index: number, element: SVGRectElement) {
    let event = new D3ChartMouseOutEvent();
    event.seriesIndex = seriesIndex;
    event.dataPoint = dataPoint;
    event.dataPointIndex = index;
    event.element = element;
    this.mouseOut.emit(event);
  }

  onClick(seriesIndex: number, dataPoint: D3ChartDataPoint, index: number, element: SVGRectElement) {
    let event = new D3ChartClickEvent();
    event.seriesIndex = seriesIndex;
    event.dataPoint = dataPoint;
    event.dataPointIndex = index;
    event.element = element;
    this.click.emit(event);
  }

  

}
