import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs'
import { D3ChartSeries } from './d3-chart-series';
import { D3ChartDataPoint } from './d3-chart-data-point';

export const DAY_MS = 1000 * 60 * 60 * 24;

@Injectable({
  providedIn: 'root'
})
export class D3ChartService {

    private data = new BehaviorSubject<Array<D3ChartSeries>>(null);

    constructor() {
        // this.getData(2, 10);
    }

    public getData(y: number, x: number, minY: number, maxY: number) : Observable<Array<D3ChartSeries>> {
        let now = (new Date()).getTime();
        setTimeout(() => {
            const _y = new Array<D3ChartSeries>();
            for (let i=0; i<y; i++) {
                const _x = new Array<D3ChartDataPoint>();
                for (let j=x-1; j>=0; j--) {
                    _x.push({x: now - j * DAY_MS, y: Math.random() * (maxY - minY) + minY});
                }
                _y.push({ name: `Zone ${i}`, dataPoints: _x });
            }
            this.data.next(_y);
        });

        return this.data;
        
    }

}
