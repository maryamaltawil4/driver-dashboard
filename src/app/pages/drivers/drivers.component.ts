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
} from 'ng-apexcharts'; import { CdkDragDrop, moveItemInArray, DragDropModule } from '@angular/cdk/drag-drop';
import * as L from 'leaflet'; // ✅ correct import



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
  imports: [ChartCardComponent, CommonModule, FormsModule, DragDropModule],
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
  deliveryDonutChartOptions: any;
  driverKpiHistory: any = [];
  tripChartOptions: any = [];
  revenueChartOptions: any = [];
  efficiencyChartOptions: any = [];
  kpis: any = [];
  topDrivers: any = [];
  barChartOptions: any;
  chartOptions: any;
  selectedPeriod: string = '30d';
  topStops: string[] = [];
  topLanes: string[] = [];
  driverTypes: any = [];
  selectedDriverType: string = '';
  filteredDrivers: any[] = [];


  constructor(private driverService: DriverService) { }
  map: any;

  ngAfterViewInit(): void {
    this.initMap();
  }


  initMap(): void {
    this.map = L.map('map').setView([31.95, 35.93], 13); // Default center

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.map);
  }


  ngOnInit() {
    this.driverService.getKpiHistory().subscribe(data => {
      this.driverKpiHistory = data;
      this.driverTypes = [...new Set(this.driverKpiHistory.map((d: any) => d.type))];

      this.updateChartOptions();
      this.tripChartOptions = {
        series: [{
          name: 'Trips Completed',
          data: this.driverKpiHistory[0].kpiHistory.map((kpi: any) => kpi.tripsCompleted)
        }],
        chart: {
          type: 'bar',
          height: 300
        },
        xaxis: {
          categories: this.driverKpiHistory[0].kpiHistory.map((kpi: any) => kpi.date)
        },
        colors: ['#6366f1']
      };
    });

    this.revenueChartOptions = {
      series: [{
        name: 'Revenue',
        data: this.driverKpiHistory.map((d: any) => d.revenueCollected)
      }],
      chart: {
        type: 'area',
        height: 300,
        sparkline: { enabled: false },
        toolbar: { show: true }
      },
      xaxis: {
        categories: this.driverKpiHistory.map((d: any) => new Date(d.date).toLocaleDateString())
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
    this.efficiencyChartOptions = {
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

  prepareTopDrivers() {
    if (!this.filteredDrivers || this.filteredDrivers.length === 0) return;

    this.topDrivers = this.filteredDrivers.map((driver: any) => {
      const kpis = this.getFilteredKPIHistory(driver); // Apply selected range
      const totalDeliveries = kpis.reduce((sum: number, k: any) => sum + (k.ordersCompleted?.count || 0), 0);
      const avgRating = kpis.length
        ? (kpis.reduce((sum: number, k: any) => sum + (k.driverRating || 0), 0) / kpis.length)
        : 0;

      return {
        name: driver.fullName,
        avatar: driver.avatar || null,
        deliveries: totalDeliveries,
        rating: parseFloat(avgRating.toFixed(1))
      };
    })
      .sort((a: any, b: any) => b.rating - a.rating)
      .slice(0, 5); // Top 5
  }


  prepareDriverEfficiencyChart() {
    if (!this.filteredDrivers || this.filteredDrivers.length === 0) return;

    const categories: string[] = [];
    const efficiencies: number[] = [];

    this.filteredDrivers.forEach((driver: any) => {
      const efficiencyValues = driver.kpiHistory.map((kpi: any) => kpi.fuelEfficiency);
      const avgEfficiency = efficiencyValues.length
        ? efficiencyValues.reduce((sum: any, val: any) => sum + val, 0) / efficiencyValues.length
        : 0;

      categories.push(driver.fullName);
      efficiencies.push(Number(avgEfficiency.toFixed(2)));
    });

    this.barChartOptions = {
      chart: {
        type: 'bar'
      },
      title: {
        text: 'Driver Efficiency Ratings'
      },
      xaxis: {
        categories
      },
      series: [{
        name: 'Fuel Efficiency (km/l)',
        data: efficiencies
      }]
    };
  }


  drop(event: CdkDragDrop<any[]>) {
    moveItemInArray(this.kpis, event.previousIndex, event.currentIndex);
  }

  updateChartOptions() {

    this.filteredDrivers = this.selectedDriverType
      ? this.driverKpiHistory.filter((d: any) => d.type === this.selectedDriverType)
      : [...this.driverKpiHistory];

    this.prepareDriverEfficiencyChart();
    this.prepareTopDrivers();
    const driver = this.driverKpiHistory.find((d: any) => d.id === this.selectedDriverId);
    const history = driver ? this.getFilteredKPIHistory(driver) : this.driverKpiHistory.flatMap((d: any) => this.getFilteredKPIHistory(d));

    // Compute KPIs dynamically for selected driver or all
    const totalRevenue = history.reduce((sum: any, e: any) => sum + (e.revenueCollected || 0), 0);
    const totalOrders = history.reduce((sum: any, e: any) => sum + (e.ordersCompleted?.count || 0), 0);
    const avgRating = history.length ? (history.reduce((sum: any, e: any) => sum + e.driverRating, 0) / history.length).toFixed(2) : '0';
    const avgFuel = history.length ? (history.reduce((sum: any, e: any) => sum + e.fuelEfficiency, 0) / history.length).toFixed(2) : '0';

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
    if (this.selectedDriver) {
      const { topStops, topLanes } = this.getTopStopsAndLanes(this.selectedDriver);
      this.topStops = topStops;
      this.topLanes = topLanes;
    }
    setTimeout(() => this.drawDriverPath(), 100);
    this.prepareWeeklyDeliveriesChart();
    this.generateAIInsights(driver);
  }

  getMostFrequentEntries(array: string[]): string[] {
    const frequencyMap: { [key: string]: number } = {};

    array.forEach((item) => {
      frequencyMap[item] = (frequencyMap[item] || 0) + 1;
    });

    // Sort by frequency descending and take top 3
    return Object.entries(frequencyMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(entry => entry[0]);
  }

  getTopStopsAndLanes(driver: any): { topStops: string[]; topLanes: string[] } {
    const allStops: string[] = [];
    const allLanes: string[] = [];

    driver.kpiHistory.forEach((entry: any) => {
      if (entry.mostVisitedStops) {
        allStops.push(...entry.mostVisitedStops);
      }
      if (entry.mostUsedLanes) {
        allLanes.push(...entry.mostUsedLanes);
      }
    });

    return {
      topStops: this.getMostFrequentEntries(allStops),
      topLanes: this.getMostFrequentEntries(allLanes)
    };
  }


  drawDriverPath() {
    debugger
    if (!this.map || !this.selectedDriver) return;

    // Clear previous polylines
    this.map.eachLayer((layer: any) => {
      if (layer instanceof L.Polyline) this.map.removeLayer(layer);
    });

    const latestEntry = [...this.selectedDriver.kpiHistory].sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )[0];

    const coordinates = (latestEntry.gpsTrack || [])
      .filter((p: any) => p.latitude !== undefined && p.longitude !== undefined)
      .map((point: any) => [point.latitude, point.longitude]);

    console.log('Coordinates:', coordinates); // ✅ Check output in browser

    if (coordinates.length > 1) {
      const polyline = L.polyline(coordinates, { color: 'blue' }).addTo(this.map);
      this.map.fitBounds(polyline.getBounds(), { padding: [30, 30] });
    }
  }

  prepareWeeklyDeliveriesChart() {
    let history: any[] = [];

    if (this.selectedDriverId) {
      const driver = this.driverKpiHistory.find((d: any) => d.id === this.selectedDriverId);
      history = driver ? this.getFilteredKPIHistory(driver) : [];
    } else {
      // Merge all drivers’ filtered kpi history
      this.driverKpiHistory.forEach((driver: any) => {
        history = history.concat(this.getFilteredKPIHistory(driver));
      });

      // Sort by date if needed
      history.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }

    if (!history.length) {
      this.chartOptions = null; // Or display a fallback
      return;
    }

    const completed = history.map((entry: any) => entry.ordersCompleted?.count || 0);
    const failed = history.map((entry: any) => {
      const total = entry.ordersCompleted?.count || 0;
      const percentage = entry.ordersCompleted?.percentage || 100;
      return Math.round(total * (1 - (percentage / 100)));
    });
    const labels = history.map((entry: any) => entry.date);

    this.chartOptions = {
      series: [
        { name: 'Completed Deliveries', data: completed },
        { name: 'Failed Deliveries', data: failed }
      ],
      chart: { height: 320, type: 'line', toolbar: { show: true } },
      xaxis: { categories: labels },
      stroke: {
        curve: 'smooth',
        width: [3, 2],
        dashArray: [0, 4]
      },
      dataLabels: { enabled: false },
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
      legend: { position: 'top' }
    };
  }



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
  
    const selectedHistory = this.getFilteredKPIHistory(driver);
    if (!selectedHistory.length) return;
  
    const otherDrivers = this.driverKpiHistory.filter((d: any) => d.id !== driver.id);
    const otherHistories = otherDrivers.flatMap((d: any) => this.getFilteredKPIHistory(d));
  
    if (!otherHistories.length) return;
  
    const avg = (entries: any[], key: string) =>
      entries.reduce((sum: number, e: any) => sum + (e[key] || 0), 0) / entries.length;
  
    const selected = {
      rating: avg(selectedHistory, 'driverRating'),
      fuel: avg(selectedHistory, 'fuelEfficiency'),
      idle: avg(selectedHistory, 'idleTime'),
      speed: avg(selectedHistory, 'averageSpeed')
    };
  
    const others = {
      rating: avg(otherHistories, 'driverRating'),
      fuel: avg(otherHistories, 'fuelEfficiency'),
      idle: avg(otherHistories, 'idleTime'),
      speed: avg(otherHistories, 'averageSpeed')
    };
  
    // Compare and push insights
    this.aiInsights.push(
      selected.rating < others.rating
        ? `Driver rating (${selected.rating.toFixed(2)}) is below team average (${others.rating.toFixed(2)}). Consider training.`
        : `Driver rating (${selected.rating.toFixed(2)}) exceeds team average (${others.rating.toFixed(2)}). Great work!`,
  
      selected.fuel < others.fuel
        ? `Fuel efficiency (${selected.fuel.toFixed(1)} MPG) is below team average (${others.fuel.toFixed(1)} MPG).`
        : `Fuel efficiency (${selected.fuel.toFixed(1)} MPG) is above team average (${others.fuel.toFixed(1)} MPG).`,
  
      selected.idle > others.idle
        ? `Idle time (${selected.idle.toFixed(1)}h) is higher than team average (${others.idle.toFixed(1)}h). Consider reviewing stops.`
        : `Idle time (${selected.idle.toFixed(1)}h) is better than team average (${others.idle.toFixed(1)}h).`,
  
      selected.speed < others.speed
        ? `Average speed (${selected.speed.toFixed(1)} km/h) is below team average (${others.speed.toFixed(1)} km/h).`
        : `Average speed (${selected.speed.toFixed(1)} km/h) is above team average (${others.speed.toFixed(1)} km/h).`
    );
  }
  
  selectRange(range: any) {
    this.selectedRange = range;
    this.updateChartOptions();
  }

  sum(arr: number[]): number {
    return arr.reduce((total, num) => total + num, 0);
  }


}