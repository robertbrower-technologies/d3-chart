import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { D3ChartService } from './d3-chart/d3-chart.service';
import { D3ChartSeries } from './d3-chart/d3-chart-series';
import { D3ChartMouseOverEvent } from './d3-chart/d3-chart-mouse-over-event';
import { D3ChartMouseOutEvent } from './d3-chart/d3-chart-mouse-out-event';
import { D3ChartClickEvent } from './d3-chart/d3-chart-click-event';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent  implements OnInit, OnDestroy {
  
  data: any;

  data$: any;

  xAxistickInterval = 5;

  formatXAxisTick: Function;

  yAxistickInterval = 1;

  formatYAxisTick: Function;

  tooltipText: string;

  mouseX: string;

  mouseY: string;

  @ViewChild('tooltip') tooltip: any;

  constructor(private chartService: D3ChartService) {

  }

  ngOnInit() {
    this.formatXAxisTick = this.unboundFormatXAxisTick.bind(this);
    this.formatYAxisTick = this.unboundFormatYAxisTick.bind(this);
    this.data$ = this.chartService.getData(2, 31, 0, 1000)
      .subscribe((data: Array<D3ChartSeries>) => {
        if (data) {
          this.data = data;
        }
      });
  }

  ngOnDestroy() {
    if (this.data$) {
      this.data$.unsubscribe();
    }
  }

  onMouseOverChart(event: any) {
    this.mouseX = `${event.offsetX}px`;
    this.mouseY = `${event.offsetY}px`;
  }

  onMouseOver(event: D3ChartMouseOverEvent) {
    this.tooltipText = `
      ${this.data[event.seriesIndex].name}
      ${new Date(event.dataPoint.x).toLocaleDateString()}
      ${event.dataPoint.y.toFixed(2)}
    `;
    this.tooltip.show();
  }

  onMouseOut(event: D3ChartMouseOutEvent) {
    this.tooltip.hide();
  }

  onClick(event: D3ChartClickEvent) {
    
  }

  unboundFormatXAxisTick(d) {
    return new Date(d).toLocaleDateString();
  }

  unboundFormatYAxisTick(d) {
    return d.toFixed(2);
  }

}
