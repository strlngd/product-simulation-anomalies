import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { LineChartComponent } from 'src/app/components/line-chart/line-chart.component';
import { Product } from 'src/app/models/product';
import { Region } from 'src/app/models/region';
import { SimulatorService } from 'src/app/services/simulator.service';

interface productDetailsData {
  product: Product;
  buyFactor: number;
  percentDiff: number;
  anomalyCount: number;
}
@Component({
  selector: 'app-region-details',
  templateUrl: './region-details.component.html',
  styleUrls: ['./region-details.component.css'],
})
export class RegionDetailsComponent implements OnInit {
  data: productDetailsData[] = [];

  private _region!: Region;

  @Input() set region(value: Region) {
    this._region = value;
    this.updateDetails();
  }

  get region(): Region {
    return this._region;
  }

  constructor(private _simulatorService: SimulatorService) {}

  ngOnInit() {
    this._simulatorService.getRefresh().subscribe((value: boolean) => {
      if (!value) return;
      this.updateDetails();
    });
  }

  updateDetails() {
    this.data = [];
    if (!this.region) return;
    const products = this._simulatorService.getProductsInRegion(
      this._region.id
    );
    products!.forEach((product) => {
      const h = this._simulatorService.getHistories().get(product.id)!;
      const last = h[h.length - 1];

      const productDetails: productDetailsData = {
        product: product,
        buyFactor: last,
        percentDiff: (last - h[h.length - 2]) / h[h.length - 2],
        anomalyCount: 0,
      };

      this._simulatorService
        .getProductAnomalies(product.id)
        .subscribe((anomalyData) => {
          productDetails.anomalyCount = anomalyData?.anomaly_indices.length!;
        });

      this.data.push(productDetails);
    });
  }
}
