import { Component, Input, OnInit } from '@angular/core';
import { Chart, ChartData } from 'chart.js/auto';
import { Point } from 'src/app/models/point';
import { Product } from 'src/app/models/product';
import { SimulatorService } from 'src/app/services/simulator.service';

@Component({
  selector: 'app-line-chart',
  templateUrl: './line-chart.component.html',
  styleUrls: ['./line-chart.component.css'],
})
export class LineChartComponent implements OnInit {
  private _product!: Product | undefined;

  @Input() set product(value: Product | undefined) {
    this._product = value;
    this.createChart();
  }

  get product(): Product | undefined {
    return this._product;
  }

  public chart: any;

  constructor(private _simulatorService: SimulatorService) {}

  ngOnInit() {
    this.createChart();
  }

  closeChart() {
    this.chart?.destroy();
    this.chart = undefined;
    this.product = undefined;
  }

  createChart() {
    if (!this.product) {
      this.chart = undefined;
      return;
    }
    this.chart?.destroy();
    const labels: number[] = [];
    for (let i = this._simulatorService.historyStorageAmount - 1; i >= 0; i--) {
      labels.push(this._simulatorService.simulationCount - i);
    }

    const history = this._simulatorService.getHistories().get(this.product.id);
    const anomalies: { x: number; y: number }[] = [];
    this._simulatorService
      .getProductAnomalies(this.product.id)
      .subscribe((anomalyData) => {
        if (!anomalyData) return;
        for (const i of anomalyData.anomaly_indices) {
          anomalies.push({ x: i + labels[0], y: history![i] });
        }
      });

    const datasets: ChartData<
      'scatter' | 'line',
      { x: number; y: number }[] | number[] | undefined
    > = {
      labels: labels,
      datasets: [
        {
          type: 'scatter',
          label: 'Anomalies',
          data: anomalies,
          fill: false,
          borderColor: 'rgb(192, 10, 10)',
          pointBackgroundColor: 'rgb(192, 10, 10)',
          pointStyle: 'cross',
          pointRadius: 5,
          pointBorderWidth: 5,
        },
        {
          type: 'line',
          label: 'Buy Factor',
          data: history,
          fill: false,
          borderColor: 'rgb(75, 192, 192)',
          tension: 0.1,
        },
      ],
    };

    this.chart = new Chart('MyChart', {
      type: 'scatter',
      data: datasets,
      options: {
        plugins: {
          title: {
            display: true,
            text: this.product.name,
            font: {
              size: 24,
            },
          },
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Simulation Day',
            },
          },
          y: {
            title: {
              display: true,
              text: 'Buy Factor',
            },
          },
        },
      },
    });
  }
}
