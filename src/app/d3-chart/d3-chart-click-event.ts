import { D3ChartDataPoint } from './d3-chart-data-point';

export class D3ChartClickEvent {
    seriesIndex: number;
    dataPoint: D3ChartDataPoint;
    dataPointIndex: number;
    element: any
}