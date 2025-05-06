import { Component } from '@angular/core';
import {
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexStroke,
  ApexDataLabels,
  ApexFill,
  ApexLegend,
  ApexPlotOptions,
  ApexResponsive
} from 'ng-apexcharts';import { CdkDragDrop, moveItemInArray, DragDropModule } from '@angular/cdk/drag-drop';


import { ChartCardComponent } from '../../shared/components/chart-card.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DriverService } from '../../services/driver.service';

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  stroke: ApexStroke;
  dataLabels: ApexDataLabels;
  fill: ApexFill;
  colors: string[];
  legend?: ApexLegend;
  plotOptions?: ApexPlotOptions;
  responsive?: ApexResponsive[];
};

@Component({
  selector: 'app-drivers',
  standalone: true,
  imports: [ChartCardComponent, CommonModule,FormsModule ,DragDropModule],
  templateUrl: './drivers.component.html',
  styleUrls: ['./drivers.component.scss']
})
export class DriversComponent {
  selectedRange: '30d' | '60d' | '90d' | 'ytd' = '30d';
  selectedDriverId: string = ''
  selectedDriver: any = null;
  aiInsights: string[] = [];
  onTimeTotal: any;
  lateTotal: any;
  deliveryDonutChartOptions:any;

  constructor( private driverService :DriverService){}
  // ngOnInit() {
  //   this.updateChartOptions();
  // }

  ngOnInit() {
    this.driverService.getKpiHistory().subscribe(data => {
      this.driverKpiHistory = data;
      this.updateChartOptions(); // optional if you want to show initial chart
    });
  }
  
  drop(event: CdkDragDrop<any[]>) {
    moveItemInArray(this.kpis, event.previousIndex, event.currentIndex);
  }
   
  updateChartOptions() {
    const driver = this.driverKpiHistory.find((d: any) => d.id === this.selectedDriverId);
    const history = driver ? this.getFilteredKPIHistory(driver) : this.driverKpiHistory.flatMap((d: any) => this.getFilteredKPIHistory(d));

    // Compute KPIs dynamically for selected driver or all
    const totalRevenue = history.reduce((sum:any, e:any) => sum + (e.revenueCollected || 0), 0);
    const totalOrders = history.reduce((sum:any, e:any) => sum + (e.ordersCompleted?.count || 0), 0);
    const avgRating = history.length ? (history.reduce((sum:any, e:any) => sum + e.driverRating, 0) / history.length).toFixed(2) : '0';
    const avgFuel = history.length ? (history.reduce((sum:any, e:any) => sum + e.fuelEfficiency, 0) / history.length).toFixed(2) : '0';

    this.kpis = [
      { label: 'Total Revenue', value: `$${totalRevenue.toLocaleString()}`, trend: 'up', visible: true },
      { label: 'Total Orders', value: totalOrders.toString(), trend: 'up', visible: true },
      { label: 'Avg Rating', value: avgRating, trend: parseFloat(avgRating) >= 4.5 ? 'up' : 'down', visible: true },
      { label: 'Fuel Efficiency', value: avgFuel + ' MPG', trend: parseFloat(avgFuel) >= 12 ? 'up' : 'down', visible: true }
    ];

    this.onTimeTotal = (history as any[]).reduce((sum, e) => sum + e.onTimeArrivalPercent, 0);
    this.lateTotal = (history as any[]).length * 100 - this.onTimeTotal;

    this.deliveryDonutChartOptions = {
      series: [this.onTimeTotal, this.lateTotal],
      labels: ['On-Time', 'Late'],
      chart: { type: 'donut', height: 320 },
      colors: ['#10b981', '#ef4444'],
      legend: { position: 'bottom' },
      dataLabels: {
        enabled: true,
        formatter: (val: any) => Math.round(val) + '%'
      }
    };

    this.efficiencyChartOptions = {
      series: [
        {
          name: 'Fuel Efficiency',
          data: history.map((entry: any) => entry.fuelEfficiency)
        },
        {
          name: 'Driver Rating',
          data: history.map((entry: any) => entry.driverRating)
        },
        {
          name: 'Idle Time',
          data: history.map((entry: any) => entry.idleTime)
        },
        {
          name: 'Average Speed',
          data: history.map((entry: any) => entry.averageSpeed)
        },
        {
          name: 'Distance Covered',
          data: history.map((entry: any) => entry.distanceCovered)
        }
      ],
      chart: {
        type: 'line',
        height: 300,
        toolbar: { show: true }
      },
      xaxis: {
        categories: history.map((entry: any) => entry.date)
      },
      colors: ['#10b981', '#f59e0b', '#6366f1', '#ef4444', '#3b82f6'],
      stroke: {
        width: [3, 2, 2, 2, 2],
        curve: 'smooth'
      },
      yaxis: [
        {
          seriesName: 'Fuel Efficiency',
          title: { text: 'MPG' },
          opposite: false
        },
        {
          seriesName: 'Driver Rating',
          title: { text: 'Rating' },
          min: 0,
          max: 5,
          opposite: true
        },
        {
          seriesName: 'Idle Time',
          title: { text: 'Idle Time (min)' },
          opposite: true
        },
        {
          seriesName: 'Average Speed',
          title: { text: 'Speed (km/h)' },
          opposite: false
        },
        {
          seriesName: 'Distance Covered',
          title: { text: 'Distance (km)' },
          opposite: true
        }
      ]
    };
    

    this.selectedDriver = driver;
    this.generateAIInsights(driver);
  }



  //   this.efficiencyChartOptions = {
  //     series: [
  //       {
  //         name: 'Fuel Efficiency',
  //         data: history.map((entry: any) => entry.fuelEfficiency)
  //       },
  //       {
  //         name: 'Driver Rating',
  //         data: history.map((entry: any) => entry.driverRating)
  //       }
  //     ],
  //     chart: {
  //       type: 'line',
  //       height: 300,
  //       toolbar: { show: true }
  //     },
  //     xaxis: {
  //       categories: history.map((entry: any) => entry.date)
  //     },
  //     colors: ['#10b981', '#f59e0b'],
  //     stroke: {
  //       width: [3, 2],
  //       curve: 'smooth'
  //     },
  //     yaxis: [
  //       {
  //         seriesName: 'Fuel Efficiency',
  //         title: { text: 'MPG' }
  //       },
  //       {
  //         seriesName: 'Driver Rating',
  //         opposite: true,
  //         title: { text: 'Rating' },
  //         min: 0,
  //         max: 5
  //       }
  //     ]
  //   };

  //   this.selectedDriver = driver;
  //   this.generateAIInsights(driver);
  // }
  
  
  // Line Chart Options
  chartOptions: ChartOptions = {
    series: [
      {
        name: 'Completed Deliveries',
        data: [12, 25, 18, 30, 22, 45, 37]
      },
      {
        name: 'Failed Deliveries',
        data: [2, 5, 3, 6, 4, 8, 5]
      }
    ],
    chart: {
      height: 320,
      type: 'line',
      toolbar: {
        show: true
      }
    },
    xaxis: {
      categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    },
    stroke: {
      curve: 'smooth',
      width: [3, 2],
      dashArray: [0, 4]
    },
    dataLabels: {
      enabled: false
    },
    fill: {
      type: 'gradient',
      gradient: {
        shade: 'light',
        type: 'vertical',
        shadeIntensity: 0.25,
        opacityFrom: 0.7,
        opacityTo: 0.1
      }
    },
    colors: ['#3b82f6', '#ef4444'],
    legend: {
      position: 'top'
    }
  };

  // Bar Chart Options
  barChartOptions: any = {
    series: [
      {
        name: 'Efficiency',
        data: [85, 72, 90, 78, 88, 92, 80]
      }
    ],
    chart: {
      height: 320,
      type: 'bar',
      toolbar: {
        show: true
      }
    },
    xaxis: {
      categories: ['Driver 1', 'Driver 2', 'Driver 3', 'Driver 4', 'Driver 5', 'Driver 6', 'Driver 7']
    },
    fill: {
      type: 'gradient',
      gradient: {
        shade: 'light',
        type: 'vertical',
        shadeIntensity: 0.25,
        opacityFrom: 0.8,
        opacityTo: 0.2
      }
    },
    colors: ['#10b981'],
    dataLabels: {
      enabled: true,
      formatter: function(val:any) {
        return val + "%";
      },
      offsetY: -20,
      style: {
        fontSize: '12px',
        colors: ["#304758"]
      }
    },
    plotOptions: {
      bar: {
        borderRadius: 4,
        columnWidth: '60%',
      }
    }
  };

  

  driverKpiHistory :any =  [
    {
      "id": "d001",
      "type": "Own",
      "fullName": "Driver 1",
      "contactInfo": {
        "phone": "+1 555 000 1001",
        "email": "driver1@example.com"
      },
      "yearsOfExperience": 11,
      "license": {
        "type": "Class A",
        "expiryDate": "2026-01-26"
      },
      "kpiHistory": [
        {
          "date": "2025-01-01",
          "tripsCompleted": 3,
          "driverRating": 4.2,
          "revenueCollected": 642,
          "ordersCompleted": {
            "count": 16,
            "percentage": 95.2
          },
          "boxesDelivered": 479,
          "boxesRejected": 0,
          "onTimeArrivalPercent": 95.9,
          "fuelConsumption": 32,
          "distanceCovered": 315,
          "workingHours": 22,
          "mostUsedLanes": [
            "Route B",
            "Route D"
          ],
          "mostVisitedStops": [
            "Depot 3",
            "Depot 1"
          ],
          "idleTime": 1.3,
          "averageSpeed": 59.3,
          "fuelEfficiency": 13.5,
          "stopFrequency": 4
        },
        {
          "date": "2025-01-08",
          "tripsCompleted": 2,
          "driverRating": 4.4,
          "revenueCollected": 784,
          "ordersCompleted": {
            "count": 10,
            "percentage": 96.4
          },
          "boxesDelivered": 281,
          "boxesRejected": 5,
          "onTimeArrivalPercent": 94.2,
          "fuelConsumption": 47,
          "distanceCovered": 379,
          "workingHours": 26,
          "mostUsedLanes": [
            "Highway 33",
            "Route A"
          ],
          "mostVisitedStops": [
            "Depot 1",
            "Warehouse Y"
          ],
          "idleTime": 0.6,
          "averageSpeed": 61.9,
          "fuelEfficiency": 13.0,
          "stopFrequency": 1
        },
        {
          "date": "2025-01-15",
          "tripsCompleted": 4,
          "driverRating": 4.5,
          "revenueCollected": 1496,
          "ordersCompleted": {
            "count": 34,
            "percentage": 86.2
          },
          "boxesDelivered": 350,
          "boxesRejected": 5,
          "onTimeArrivalPercent": 96.2,
          "fuelConsumption": 53,
          "distanceCovered": 595,
          "workingHours": 26,
          "mostUsedLanes": [
            "Route A",
            "Route D"
          ],
          "mostVisitedStops": [
            "Depot 2",
            "Warehouse X"
          ],
          "idleTime": 2.0,
          "averageSpeed": 62.1,
          "fuelEfficiency": 14.3,
          "stopFrequency": 4
        },
        {
          "date": "2025-01-22",
          "tripsCompleted": 3,
          "driverRating": 4.5,
          "revenueCollected": 1354,
          "ordersCompleted": {
            "count": 33,
            "percentage": 87.4
          },
          "boxesDelivered": 381,
          "boxesRejected": 1,
          "onTimeArrivalPercent": 96.7,
          "fuelConsumption": 34,
          "distanceCovered": 611,
          "workingHours": 40,
          "mostUsedLanes": [
            "Route B",
            "Route D"
          ],
          "mostVisitedStops": [
            "Depot 2",
            "Warehouse Y"
          ],
          "idleTime": 1.1,
          "averageSpeed": 64.8,
          "fuelEfficiency": 13.2,
          "stopFrequency": 2
        },
        {
          "date": "2025-01-29",
          "tripsCompleted": 3,
          "driverRating": 4.8,
          "revenueCollected": 1294,
          "ordersCompleted": {
            "count": 13,
            "percentage": 88.4
          },
          "boxesDelivered": 216,
          "boxesRejected": 2,
          "onTimeArrivalPercent": 94.0,
          "fuelConsumption": 34,
          "distanceCovered": 408,
          "workingHours": 38,
          "mostUsedLanes": [
            "Highway 33",
            "Route B"
          ],
          "mostVisitedStops": [
            "Warehouse Y",
            "Depot 3"
          ],
          "idleTime": 1.8,
          "averageSpeed": 57.9,
          "fuelEfficiency": 10.7,
          "stopFrequency": 2
        },
        {
          "date": "2025-02-05",
          "tripsCompleted": 2,
          "driverRating": 4.7,
          "revenueCollected": 1051,
          "ordersCompleted": {
            "count": 26,
            "percentage": 96.2
          },
          "boxesDelivered": 419,
          "boxesRejected": 4,
          "onTimeArrivalPercent": 94.0,
          "fuelConsumption": 44,
          "distanceCovered": 370,
          "workingHours": 36,
          "mostUsedLanes": [
            "Route C",
            "Route A"
          ],
          "mostVisitedStops": [
            "Depot 1",
            "Depot 3"
          ],
          "idleTime": 0.7,
          "averageSpeed": 48.2,
          "fuelEfficiency": 13.4,
          "stopFrequency": 1
        },
        {
          "date": "2025-02-12",
          "tripsCompleted": 4,
          "driverRating": 4.4,
          "revenueCollected": 979,
          "ordersCompleted": {
            "count": 43,
            "percentage": 88.8
          },
          "boxesDelivered": 483,
          "boxesRejected": 0,
          "onTimeArrivalPercent": 96.8,
          "fuelConsumption": 37,
          "distanceCovered": 649,
          "workingHours": 37,
          "mostUsedLanes": [
            "Highway 33",
            "Route D"
          ],
          "mostVisitedStops": [
            "Depot 1",
            "Warehouse X"
          ],
          "idleTime": 1.2,
          "averageSpeed": 54.1,
          "fuelEfficiency": 14.8,
          "stopFrequency": 3
        },
        {
          "date": "2025-02-19",
          "tripsCompleted": 5,
          "driverRating": 4.8,
          "revenueCollected": 1019,
          "ordersCompleted": {
            "count": 16,
            "percentage": 98.1
          },
          "boxesDelivered": 352,
          "boxesRejected": 5,
          "onTimeArrivalPercent": 95.1,
          "fuelConsumption": 42,
          "distanceCovered": 378,
          "workingHours": 31,
          "mostUsedLanes": [
            "Route B",
            "Route A"
          ],
          "mostVisitedStops": [
            "Depot 3",
            "Warehouse X"
          ],
          "idleTime": 1.2,
          "averageSpeed": 47.2,
          "fuelEfficiency": 11.8,
          "stopFrequency": 3
        },
        {
          "date": "2025-02-26",
          "tripsCompleted": 2,
          "driverRating": 4.1,
          "revenueCollected": 1399,
          "ordersCompleted": {
            "count": 46,
            "percentage": 99.2
          },
          "boxesDelivered": 243,
          "boxesRejected": 5,
          "onTimeArrivalPercent": 94.9,
          "fuelConsumption": 34,
          "distanceCovered": 800,
          "workingHours": 37,
          "mostUsedLanes": [
            "Route B",
            "Route D"
          ],
          "mostVisitedStops": [
            "Warehouse Y",
            "Depot 2"
          ],
          "idleTime": 0.9,
          "averageSpeed": 62.4,
          "fuelEfficiency": 12.1,
          "stopFrequency": 2
        },
        {
          "date": "2025-03-05",
          "tripsCompleted": 5,
          "driverRating": 4.8,
          "revenueCollected": 1206,
          "ordersCompleted": {
            "count": 22,
            "percentage": 95.7
          },
          "boxesDelivered": 404,
          "boxesRejected": 5,
          "onTimeArrivalPercent": 96.5,
          "fuelConsumption": 58,
          "distanceCovered": 760,
          "workingHours": 36,
          "mostUsedLanes": [
            "Route C",
            "Route A"
          ],
          "mostVisitedStops": [
            "Depot 2",
            "Depot 3"
          ],
          "idleTime": 0.6,
          "averageSpeed": 45.4,
          "fuelEfficiency": 12.8,
          "stopFrequency": 2
        },
        {
          "date": "2025-03-12",
          "tripsCompleted": 1,
          "driverRating": 4.1,
          "revenueCollected": 1146,
          "ordersCompleted": {
            "count": 13,
            "percentage": 88.4
          },
          "boxesDelivered": 216,
          "boxesRejected": 2,
          "onTimeArrivalPercent": 90.7,
          "fuelConsumption": 45,
          "distanceCovered": 442,
          "workingHours": 35,
          "mostUsedLanes": [
            "Route B",
            "Route D"
          ],
          "mostVisitedStops": [
            "Depot 3",
            "Warehouse Y"
          ],
          "idleTime": 0.9,
          "averageSpeed": 54.5,
          "fuelEfficiency": 12.0,
          "stopFrequency": 1
        },
        {
          "date": "2025-03-19",
          "tripsCompleted": 1,
          "driverRating": 4.7,
          "revenueCollected": 862,
          "ordersCompleted": {
            "count": 37,
            "percentage": 91.2
          },
          "boxesDelivered": 573,
          "boxesRejected": 0,
          "onTimeArrivalPercent": 96.7,
          "fuelConsumption": 36,
          "distanceCovered": 331,
          "workingHours": 32,
          "mostUsedLanes": [
            "Highway 33",
            "Route A"
          ],
          "mostVisitedStops": [
            "Depot 2",
            "Depot 3"
          ],
          "idleTime": 0.8,
          "averageSpeed": 54.0,
          "fuelEfficiency": 12.1,
          "stopFrequency": 3
        },
        {
          "date": "2025-03-26",
          "tripsCompleted": 4,
          "driverRating": 4.2,
          "revenueCollected": 1445,
          "ordersCompleted": {
            "count": 14,
            "percentage": 91.6
          },
          "boxesDelivered": 481,
          "boxesRejected": 0,
          "onTimeArrivalPercent": 90.5,
          "fuelConsumption": 64,
          "distanceCovered": 728,
          "workingHours": 20,
          "mostUsedLanes": [
            "Route A",
            "Route B"
          ],
          "mostVisitedStops": [
            "Depot 2",
            "Warehouse Y"
          ],
          "idleTime": 1.2,
          "averageSpeed": 49.3,
          "fuelEfficiency": 12.0,
          "stopFrequency": 1
        },
        {
          "date": "2025-04-02",
          "tripsCompleted": 2,
          "driverRating": 4.4,
          "revenueCollected": 899,
          "ordersCompleted": {
            "count": 26,
            "percentage": 98.9
          },
          "boxesDelivered": 432,
          "boxesRejected": 2,
          "onTimeArrivalPercent": 94.2,
          "fuelConsumption": 65,
          "distanceCovered": 638,
          "workingHours": 35,
          "mostUsedLanes": [
            "Route B",
            "Route D"
          ],
          "mostVisitedStops": [
            "Warehouse X",
            "Depot 2"
          ],
          "idleTime": 2.0,
          "averageSpeed": 56.6,
          "fuelEfficiency": 12.7,
          "stopFrequency": 3
        },
        {
          "date": "2025-04-09",
          "tripsCompleted": 1,
          "driverRating": 4.1,
          "revenueCollected": 988,
          "ordersCompleted": {
            "count": 42,
            "percentage": 98.8
          },
          "boxesDelivered": 471,
          "boxesRejected": 1,
          "onTimeArrivalPercent": 90.6,
          "fuelConsumption": 62,
          "distanceCovered": 341,
          "workingHours": 25,
          "mostUsedLanes": [
            "Route A",
            "Route D"
          ],
          "mostVisitedStops": [
            "Depot 2",
            "Warehouse Y"
          ],
          "idleTime": 0.7,
          "averageSpeed": 62.8,
          "fuelEfficiency": 11.2,
          "stopFrequency": 1
        },
        {
          "date": "2025-04-16",
          "tripsCompleted": 5,
          "driverRating": 4.1,
          "revenueCollected": 1173,
          "ordersCompleted": {
            "count": 47,
            "percentage": 93.5
          },
          "boxesDelivered": 361,
          "boxesRejected": 2,
          "onTimeArrivalPercent": 92.0,
          "fuelConsumption": 50,
          "distanceCovered": 422,
          "workingHours": 28,
          "mostUsedLanes": [
            "Route C",
            "Route B"
          ],
          "mostVisitedStops": [
            "Warehouse X",
            "Warehouse Y"
          ],
          "idleTime": 1.0,
          "averageSpeed": 60.0,
          "fuelEfficiency": 10.4,
          "stopFrequency": 4
        },
        {
          "date": "2025-04-23",
          "tripsCompleted": 5,
          "driverRating": 5.0,
          "revenueCollected": 602,
          "ordersCompleted": {
            "count": 14,
            "percentage": 93.1
          },
          "boxesDelivered": 459,
          "boxesRejected": 2,
          "onTimeArrivalPercent": 91.3,
          "fuelConsumption": 52,
          "distanceCovered": 751,
          "workingHours": 22,
          "mostUsedLanes": [
            "Route B",
            "Highway 33"
          ],
          "mostVisitedStops": [
            "Warehouse X",
            "Depot 2"
          ],
          "idleTime": 1.2,
          "averageSpeed": 55.9,
          "fuelEfficiency": 11.5,
          "stopFrequency": 1
        },
        {
          "date": "2025-04-30",
          "tripsCompleted": 5,
          "driverRating": 4.3,
          "revenueCollected": 1179,
          "ordersCompleted": {
            "count": 16,
            "percentage": 99.1
          },
          "boxesDelivered": 268,
          "boxesRejected": 2,
          "onTimeArrivalPercent": 91.2,
          "fuelConsumption": 36,
          "distanceCovered": 680,
          "workingHours": 37,
          "mostUsedLanes": [
            "Route B",
            "Highway 33"
          ],
          "mostVisitedStops": [
            "Warehouse X",
            "Depot 2"
          ],
          "idleTime": 1.6,
          "averageSpeed": 49.1,
          "fuelEfficiency": 13.2,
          "stopFrequency": 3
        },
        {
          "date": "2025-05-07",
          "tripsCompleted": 5,
          "driverRating": 4.5,
          "revenueCollected": 1427,
          "ordersCompleted": {
            "count": 13,
            "percentage": 86.4
          },
          "boxesDelivered": 416,
          "boxesRejected": 2,
          "onTimeArrivalPercent": 90.4,
          "fuelConsumption": 51,
          "distanceCovered": 694,
          "workingHours": 24,
          "mostUsedLanes": [
            "Highway 33",
            "Route B"
          ],
          "mostVisitedStops": [
            "Warehouse Y",
            "Depot 3"
          ],
          "idleTime": 1.3,
          "averageSpeed": 47.2,
          "fuelEfficiency": 14.7,
          "stopFrequency": 2
        },
        {
          "date": "2025-05-14",
          "tripsCompleted": 5,
          "driverRating": 4.0,
          "revenueCollected": 878,
          "ordersCompleted": {
            "count": 47,
            "percentage": 93.3
          },
          "boxesDelivered": 420,
          "boxesRejected": 1,
          "onTimeArrivalPercent": 90.4,
          "fuelConsumption": 53,
          "distanceCovered": 760,
          "workingHours": 21,
          "mostUsedLanes": [
            "Highway 33",
            "Route B"
          ],
          "mostVisitedStops": [
            "Depot 2",
            "Depot 1"
          ],
          "idleTime": 1.0,
          "averageSpeed": 56.2,
          "fuelEfficiency": 14.4,
          "stopFrequency": 2
        }
      ]
    },
    {
      "id": "d002",
      "type": "Own",
      "fullName": "Driver 2",
      "contactInfo": {
        "phone": "+1 555 000 1002",
        "email": "driver2@example.com"
      },
      "yearsOfExperience": 15,
      "license": {
        "type": "Class A",
        "expiryDate": "2026-06-16"
      },
      "kpiHistory": [
        {
          "date": "2025-01-01",
          "tripsCompleted": 2,
          "driverRating": 4.9,
          "revenueCollected": 525,
          "ordersCompleted": {
            "count": 21,
            "percentage": 96.0
          },
          "boxesDelivered": 370,
          "boxesRejected": 3,
          "onTimeArrivalPercent": 98.0,
          "fuelConsumption": 45,
          "distanceCovered": 436,
          "workingHours": 25,
          "mostUsedLanes": [
            "Route A",
            "Route C"
          ],
          "mostVisitedStops": [
            "Depot 1",
            "Warehouse Y"
          ],
          "idleTime": 0.8,
          "averageSpeed": 61.3,
          "fuelEfficiency": 12.3,
          "stopFrequency": 3
        },
        {
          "date": "2025-01-08",
          "tripsCompleted": 2,
          "driverRating": 4.2,
          "revenueCollected": 1175,
          "ordersCompleted": {
            "count": 22,
            "percentage": 91.0
          },
          "boxesDelivered": 342,
          "boxesRejected": 0,
          "onTimeArrivalPercent": 99.7,
          "fuelConsumption": 47,
          "distanceCovered": 479,
          "workingHours": 40,
          "mostUsedLanes": [
            "Route D",
            "Route C"
          ],
          "mostVisitedStops": [
            "Depot 3",
            "Warehouse X"
          ],
          "idleTime": 1.9,
          "averageSpeed": 47.3,
          "fuelEfficiency": 14.9,
          "stopFrequency": 2
        },
        {
          "date": "2025-01-15",
          "tripsCompleted": 5,
          "driverRating": 5.0,
          "revenueCollected": 771,
          "ordersCompleted": {
            "count": 12,
            "percentage": 86.6
          },
          "boxesDelivered": 422,
          "boxesRejected": 2,
          "onTimeArrivalPercent": 97.3,
          "fuelConsumption": 50,
          "distanceCovered": 523,
          "workingHours": 39,
          "mostUsedLanes": [
            "Route D",
            "Route A"
          ],
          "mostVisitedStops": [
            "Warehouse Y",
            "Depot 2"
          ],
          "idleTime": 0.9,
          "averageSpeed": 59.2,
          "fuelEfficiency": 10.0,
          "stopFrequency": 2
        },
        {
          "date": "2025-01-22",
          "tripsCompleted": 3,
          "driverRating": 4.4,
          "revenueCollected": 1471,
          "ordersCompleted": {
            "count": 31,
            "percentage": 94.3
          },
          "boxesDelivered": 539,
          "boxesRejected": 0,
          "onTimeArrivalPercent": 97.2,
          "fuelConsumption": 49,
          "distanceCovered": 559,
          "workingHours": 29,
          "mostUsedLanes": [
            "Route C",
            "Highway 33"
          ],
          "mostVisitedStops": [
            "Warehouse Y",
            "Warehouse X"
          ],
          "idleTime": 1.3,
          "averageSpeed": 48.8,
          "fuelEfficiency": 13.3,
          "stopFrequency": 4
        },
        {
          "date": "2025-01-29",
          "tripsCompleted": 2,
          "driverRating": 4.6,
          "revenueCollected": 808,
          "ordersCompleted": {
            "count": 35,
            "percentage": 93.2
          },
          "boxesDelivered": 200,
          "boxesRejected": 2,
          "onTimeArrivalPercent": 92.9,
          "fuelConsumption": 57,
          "distanceCovered": 702,
          "workingHours": 38,
          "mostUsedLanes": [
            "Route D",
            "Highway 33"
          ],
          "mostVisitedStops": [
            "Warehouse Y",
            "Depot 3"
          ],
          "idleTime": 1.2,
          "averageSpeed": 49.3,
          "fuelEfficiency": 12.4,
          "stopFrequency": 2
        },
        {
          "date": "2025-02-05",
          "tripsCompleted": 1,
          "driverRating": 4.3,
          "revenueCollected": 1179,
          "ordersCompleted": {
            "count": 50,
            "percentage": 94.3
          },
          "boxesDelivered": 247,
          "boxesRejected": 1,
          "onTimeArrivalPercent": 96.7,
          "fuelConsumption": 44,
          "distanceCovered": 712,
          "workingHours": 26,
          "mostUsedLanes": [
            "Route B",
            "Route A"
          ],
          "mostVisitedStops": [
            "Depot 1",
            "Depot 2"
          ],
          "idleTime": 2.0,
          "averageSpeed": 57.2,
          "fuelEfficiency": 13.8,
          "stopFrequency": 4
        },
        {
          "date": "2025-02-12",
          "tripsCompleted": 4,
          "driverRating": 4.9,
          "revenueCollected": 1089,
          "ordersCompleted": {
            "count": 22,
            "percentage": 95.8
          },
          "boxesDelivered": 396,
          "boxesRejected": 3,
          "onTimeArrivalPercent": 94.0,
          "fuelConsumption": 39,
          "distanceCovered": 635,
          "workingHours": 20,
          "mostUsedLanes": [
            "Route A",
            "Route C"
          ],
          "mostVisitedStops": [
            "Depot 2",
            "Depot 3"
          ],
          "idleTime": 1.7,
          "averageSpeed": 58.9,
          "fuelEfficiency": 12.3,
          "stopFrequency": 2
        },
        {
          "date": "2025-02-19",
          "tripsCompleted": 1,
          "driverRating": 4.5,
          "revenueCollected": 1320,
          "ordersCompleted": {
            "count": 39,
            "percentage": 95.0
          },
          "boxesDelivered": 486,
          "boxesRejected": 4,
          "onTimeArrivalPercent": 93.2,
          "fuelConsumption": 58,
          "distanceCovered": 613,
          "workingHours": 36,
          "mostUsedLanes": [
            "Route C",
            "Route D"
          ],
          "mostVisitedStops": [
            "Depot 2",
            "Warehouse Y"
          ],
          "idleTime": 1.2,
          "averageSpeed": 60.0,
          "fuelEfficiency": 14.2,
          "stopFrequency": 3
        },
        {
          "date": "2025-02-26",
          "tripsCompleted": 5,
          "driverRating": 4.5,
          "revenueCollected": 744,
          "ordersCompleted": {
            "count": 27,
            "percentage": 91.6
          },
          "boxesDelivered": 565,
          "boxesRejected": 2,
          "onTimeArrivalPercent": 92.3,
          "fuelConsumption": 51,
          "distanceCovered": 463,
          "workingHours": 37,
          "mostUsedLanes": [
            "Route A",
            "Route B"
          ],
          "mostVisitedStops": [
            "Depot 2",
            "Depot 3"
          ],
          "idleTime": 1.1,
          "averageSpeed": 48.1,
          "fuelEfficiency": 11.1,
          "stopFrequency": 4
        },
        {
          "date": "2025-03-05",
          "tripsCompleted": 4,
          "driverRating": 4.3,
          "revenueCollected": 977,
          "ordersCompleted": {
            "count": 36,
            "percentage": 85.9
          },
          "boxesDelivered": 415,
          "boxesRejected": 3,
          "onTimeArrivalPercent": 99.0,
          "fuelConsumption": 67,
          "distanceCovered": 784,
          "workingHours": 20,
          "mostUsedLanes": [
            "Route D",
            "Route C"
          ],
          "mostVisitedStops": [
            "Warehouse Y",
            "Depot 1"
          ],
          "idleTime": 1.9,
          "averageSpeed": 51.0,
          "fuelEfficiency": 11.9,
          "stopFrequency": 4
        },
        {
          "date": "2025-03-12",
          "tripsCompleted": 5,
          "driverRating": 4.7,
          "revenueCollected": 1059,
          "ordersCompleted": {
            "count": 48,
            "percentage": 98.5
          },
          "boxesDelivered": 449,
          "boxesRejected": 1,
          "onTimeArrivalPercent": 92.7,
          "fuelConsumption": 61,
          "distanceCovered": 314,
          "workingHours": 32,
          "mostUsedLanes": [
            "Highway 33",
            "Route C"
          ],
          "mostVisitedStops": [
            "Depot 2",
            "Warehouse Y"
          ],
          "idleTime": 1.9,
          "averageSpeed": 64.6,
          "fuelEfficiency": 12.7,
          "stopFrequency": 4
        },
        {
          "date": "2025-03-19",
          "tripsCompleted": 5,
          "driverRating": 4.6,
          "revenueCollected": 527,
          "ordersCompleted": {
            "count": 15,
            "percentage": 94.6
          },
          "boxesDelivered": 269,
          "boxesRejected": 3,
          "onTimeArrivalPercent": 91.8,
          "fuelConsumption": 46,
          "distanceCovered": 494,
          "workingHours": 30,
          "mostUsedLanes": [
            "Route B",
            "Route C"
          ],
          "mostVisitedStops": [
            "Warehouse X",
            "Depot 3"
          ],
          "idleTime": 1.6,
          "averageSpeed": 52.6,
          "fuelEfficiency": 13.8,
          "stopFrequency": 4
        },
        {
          "date": "2025-03-26",
          "tripsCompleted": 3,
          "driverRating": 4.8,
          "revenueCollected": 981,
          "ordersCompleted": {
            "count": 11,
            "percentage": 96.2
          },
          "boxesDelivered": 226,
          "boxesRejected": 2,
          "onTimeArrivalPercent": 92.2,
          "fuelConsumption": 34,
          "distanceCovered": 699,
          "workingHours": 40,
          "mostUsedLanes": [
            "Route A",
            "Route D"
          ],
          "mostVisitedStops": [
            "Depot 2",
            "Depot 3"
          ],
          "idleTime": 1.8,
          "averageSpeed": 57.4,
          "fuelEfficiency": 11.2,
          "stopFrequency": 4
        },
        {
          "date": "2025-04-02",
          "tripsCompleted": 1,
          "driverRating": 4.6,
          "revenueCollected": 723,
          "ordersCompleted": {
            "count": 39,
            "percentage": 95.5
          },
          "boxesDelivered": 592,
          "boxesRejected": 2,
          "onTimeArrivalPercent": 91.7,
          "fuelConsumption": 68,
          "distanceCovered": 793,
          "workingHours": 23,
          "mostUsedLanes": [
            "Route B",
            "Highway 33"
          ],
          "mostVisitedStops": [
            "Depot 1",
            "Depot 3"
          ],
          "idleTime": 1.9,
          "averageSpeed": 56.5,
          "fuelEfficiency": 14.5,
          "stopFrequency": 4
        },
        {
          "date": "2025-04-09",
          "tripsCompleted": 4,
          "driverRating": 4.9,
          "revenueCollected": 703,
          "ordersCompleted": {
            "count": 14,
            "percentage": 93.9
          },
          "boxesDelivered": 521,
          "boxesRejected": 1,
          "onTimeArrivalPercent": 91.0,
          "fuelConsumption": 49,
          "distanceCovered": 735,
          "workingHours": 39,
          "mostUsedLanes": [
            "Route A",
            "Route D"
          ],
          "mostVisitedStops": [
            "Warehouse X",
            "Warehouse Y"
          ],
          "idleTime": 1.5,
          "averageSpeed": 46.4,
          "fuelEfficiency": 13.2,
          "stopFrequency": 1
        },
        {
          "date": "2025-04-16",
          "tripsCompleted": 4,
          "driverRating": 4.8,
          "revenueCollected": 608,
          "ordersCompleted": {
            "count": 37,
            "percentage": 99.4
          },
          "boxesDelivered": 525,
          "boxesRejected": 3,
          "onTimeArrivalPercent": 97.1,
          "fuelConsumption": 57,
          "distanceCovered": 390,
          "workingHours": 36,
          "mostUsedLanes": [
            "Highway 33",
            "Route C"
          ],
          "mostVisitedStops": [
            "Warehouse Y",
            "Depot 3"
          ],
          "idleTime": 1.7,
          "averageSpeed": 56.8,
          "fuelEfficiency": 11.6,
          "stopFrequency": 2
        },
        {
          "date": "2025-04-23",
          "tripsCompleted": 1,
          "driverRating": 4.3,
          "revenueCollected": 961,
          "ordersCompleted": {
            "count": 25,
            "percentage": 96.3
          },
          "boxesDelivered": 491,
          "boxesRejected": 4,
          "onTimeArrivalPercent": 96.7,
          "fuelConsumption": 51,
          "distanceCovered": 314,
          "workingHours": 35,
          "mostUsedLanes": [
            "Highway 33",
            "Route B"
          ],
          "mostVisitedStops": [
            "Warehouse Y",
            "Depot 2"
          ],
          "idleTime": 1.0,
          "averageSpeed": 50.2,
          "fuelEfficiency": 11.4,
          "stopFrequency": 3
        },
        {
          "date": "2025-04-30",
          "tripsCompleted": 5,
          "driverRating": 4.0,
          "revenueCollected": 1470,
          "ordersCompleted": {
            "count": 22,
            "percentage": 86.3
          },
          "boxesDelivered": 568,
          "boxesRejected": 3,
          "onTimeArrivalPercent": 94.9,
          "fuelConsumption": 45,
          "distanceCovered": 653,
          "workingHours": 35,
          "mostUsedLanes": [
            "Route C",
            "Route D"
          ],
          "mostVisitedStops": [
            "Depot 1",
            "Depot 3"
          ],
          "idleTime": 0.9,
          "averageSpeed": 53.1,
          "fuelEfficiency": 11.2,
          "stopFrequency": 3
        },
        {
          "date": "2025-05-07",
          "tripsCompleted": 4,
          "driverRating": 4.6,
          "revenueCollected": 852,
          "ordersCompleted": {
            "count": 37,
            "percentage": 99.9
          },
          "boxesDelivered": 481,
          "boxesRejected": 2,
          "onTimeArrivalPercent": 93.5,
          "fuelConsumption": 59,
          "distanceCovered": 438,
          "workingHours": 29,
          "mostUsedLanes": [
            "Highway 33",
            "Route B"
          ],
          "mostVisitedStops": [
            "Depot 1",
            "Depot 2"
          ],
          "idleTime": 1.0,
          "averageSpeed": 59.9,
          "fuelEfficiency": 14.8,
          "stopFrequency": 2
        },
        {
          "date": "2025-05-14",
          "tripsCompleted": 2,
          "driverRating": 4.2,
          "revenueCollected": 995,
          "ordersCompleted": {
            "count": 27,
            "percentage": 95.9
          },
          "boxesDelivered": 589,
          "boxesRejected": 4,
          "onTimeArrivalPercent": 96.0,
          "fuelConsumption": 36,
          "distanceCovered": 726,
          "workingHours": 26,
          "mostUsedLanes": [
            "Highway 33",
            "Route B"
          ],
          "mostVisitedStops": [
            "Warehouse X",
            "Depot 2"
          ],
          "idleTime": 1.0,
          "averageSpeed": 59.2,
          "fuelEfficiency": 10.6,
          "stopFrequency": 1
        }
      ]
    }]

    tripChartOptions = {
      series: [{
        name: 'Trips Completed',
        data: this.driverKpiHistory[0].kpiHistory.map((kpi:any) => kpi.tripsCompleted)
      }],
      chart: {
        type: 'bar',
        height: 300
      },
      xaxis: {
        categories: this.driverKpiHistory[0].kpiHistory.map((kpi:any) => kpi.date)
      },
      colors: ['#6366f1']
    };
    
  // Donut Chart Options
  donutChartOptions: any = {
    series: [211, 896, 120],
    chart: {
      type: 'donut',
      height: 320
    },
    colors: ['#3b82f6', '#10b981', '#f59e0b'],
    labels: ['Direct Sale', 'Third Party', 'Other'],
    legend: {
      position: 'bottom'
    },
    dataLabels: {
      enabled: true,
      formatter: function (val:any) {
        return Math.round(val) + "%";
      }
    },
    responsive: [{
      breakpoint: 480,
      options: {
        chart: {
          width: 200
        },
        legend: {
          position: 'bottom'
        }
      }
    }]
  };



  // Add to your component class
selectedPeriod: string = '30d';


// New chart options
revenueChartOptions: any = {
  series: [{
    name: 'Revenue',
    data: this.driverKpiHistory.map((d:any) => d.revenueCollected)
  }],
  chart: {
    type: 'area',
    height: 300,
    sparkline: { enabled: false },
    toolbar: { show: true }
  },
  xaxis: {
    categories: this.driverKpiHistory.map((d:any) => new Date(d.date).toLocaleDateString())
  },
  colors: ['#3b82f6'],
  fill: {
    type: 'gradient',
    gradient: {
      shadeIntensity: 1,
      opacityFrom: 0.7,
      opacityTo: 0.2,
    }
  }
};

getFilteredKPIHistory(driver: any) {
  const today = new Date();
  let days = 30;
  if (this.selectedRange === '60d') days = 60;
  else if (this.selectedRange === '90d') days = 90;
  else if (this.selectedRange === 'ytd') {
    const start = new Date(today.getFullYear(), 0, 0);
    const diff = today.getTime() - start.getTime();
    days = Math.floor(diff / (1000 * 60 * 60 * 24));
  }
  return driver.kpiHistory.filter((entry: any) => {
    const entryDate = new Date(entry.date);
    return (today.getTime() - entryDate.getTime()) / (1000 * 3600 * 24) <= days;
  });
}



generateAIInsights(driver: any) {
  this.aiInsights = [];
  if (!driver) return;

  const filtered = this.getFilteredKPIHistory(driver);
  const avgRating = filtered.reduce((sum:any, e:any) => sum + e.driverRating, 0) / filtered.length;
  const avgFuel = filtered.reduce((sum:any, e:any) => sum + e.fuelEfficiency, 0) / filtered.length;
  const avgIdleTime = filtered.reduce((sum:any, e:any) => sum + e.idleTime, 0) / filtered.length;
  const avgSpeed = filtered.reduce((sum:any, e:any) => sum + e.averageSpeed, 0) / filtered.length;

  if (avgRating < 4.3) this.aiInsights.push("Consider driver coaching to improve ratings.");
  if (avgFuel < 12) this.aiInsights.push("Fuel efficiency below average – review driving behavior.");
  if (avgIdleTime > 1.5) this.aiInsights.push("High idle time – review stop durations.");
if (avgSpeed < 50) this.aiInsights.push("Average speed is low – check for route inefficiencies.");
}

selectPeriod(period: string) {
  this.selectedPeriod = period;
  // Add logic to filter data based on period
  // This would typically call a service to get filtered data
}


  selectRange(range: any) {
    this.selectedRange = range;
    this.updateChartOptions();
    // Later: refresh KPIs and chart data based on backend
  }




  sum(arr: number[]): number {
    return arr.reduce((total, num) => total + num, 0);
  }
  
  kpis :any = [
    { label: 'Total Sales', value: '$0.00M', trend: 'up', color: 'bg-green-100 text-green-800', visible: true },
    { label: 'Total Orders', value: '9', trend: 'down', color: 'bg-red-100 text-red-800' ,visible: true },
    { label: 'PY Sales', value: '43.46', trend: 'down', color: 'bg-red-100 text-red-800' ,visible: true },
    { label: 'YoY % Growth', value: '2448.57%', trend: 'up', color: 'bg-green-100 text-green-800' ,visible: true },
    { label: 'Profit', value: '100.88', trend: 'up', color: 'bg-green-100 text-green-800',visible: true },
  ];

  topDrivers = [
    { name: 'John Smith', deliveries: 128, rating: 4.9, avatar: 'https://randomuser.me/api/portraits/men/1.jpg' },
    { name: 'Sarah Johnson', deliveries: 115, rating: 4.8, avatar: 'https://randomuser.me/api/portraits/women/1.jpg' },
    { name: 'Michael Brown', deliveries: 98, rating: 4.7, avatar: 'https://randomuser.me/api/portraits/men/2.jpg' },
    { name: 'Emily Davis', deliveries: 87, rating: 4.6, avatar: 'https://randomuser.me/api/portraits/women/2.jpg' }
  ];

  efficiencyChartOptions: any = {
    series: [
      {
        name: 'Fuel Efficiency',
        data: this.driverKpiHistory[0].kpiHistory.map((entry: any) => entry.fuelEfficiency)
      },
      {
        name: 'Driver Rating',
        data: this.driverKpiHistory[0].kpiHistory.map((entry: any) => entry.driverRating)
      }
    ],
    chart: {
      type: 'line',
      height: 300,
      toolbar: { show: true }
    },
    xaxis: {
      categories: this.driverKpiHistory[0].kpiHistory.map((entry: any) => entry.date)
    },
    colors: ['#10b981', '#f59e0b'],
    stroke: {
      width: [3, 2],
      curve: 'smooth'
    },
    yaxis: [
      {
        seriesName: 'Fuel Efficiency',
        title: { text: 'MPG' }
      },
      {
        seriesName: 'Driver Rating',
        opposite: true,
        title: { text: 'Rating' },
        min: 0,
        max: 5
      }
    ]
  };

  
 
  
  
}