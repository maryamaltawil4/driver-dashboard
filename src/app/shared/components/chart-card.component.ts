import { Component, Input } from '@angular/core';
import { NgApexchartsModule, ApexOptions } from 'ng-apexcharts';

@Component({
  selector: 'app-chart-card',
  standalone: true,
  imports: [NgApexchartsModule],
  template: `
    <div class="card p-3 h-100">
      <h6 class="mb-3">{{ title }}</h6>
      <apx-chart 
        [series]="options.series!"
        [chart]="options.chart!"
        [xaxis]="options.xaxis!"
        [stroke]="options.stroke!"
        [fill]="options.fill!"
        [dataLabels]="options.dataLabels!"
        [colors]="options.colors!">
      </apx-chart>
    </div>
  `,
})
export class ChartCardComponent {
  @Input() title = '';
  @Input({ required: true }) options!: ApexOptions;
}
