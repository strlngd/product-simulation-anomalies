import { Component, Input, OnInit } from '@angular/core';
import { Product } from 'src/app/models/product';
import { Region } from 'src/app/models/region';
import { Simulator } from 'src/app/simulation/simulator';

@Component({
  selector: 'app-region-details',
  templateUrl: './region-details.component.html',
  styleUrls: ['./region-details.component.css'],
})
export class RegionDetailsComponent {
  private _region!: Region;

  @Input() set region(value: Region) {
    this._region = value;
    this.data = [];
    this.onRegionUpdated();
  }

  get region(): Region {
    return this._region;
  }

  data: { name: string; buyFactor: number; percentDiff: number }[] = [];

  ngOnInit() {
    const simulator = Simulator.getInstance();
    for (let i = 0; i < 99; i++) {
      simulator.simulateNext();
    }
    const products = simulator.getProductsInRegion('aisle_1');
    products!.forEach((product) => {
      const h = simulator.getHistories().get(product.id)!;
      // this.data = h.join(' ');
      console.log('history', h);
      console.log('last: ', h[h.length - 1]);
    });
  }

  onRegionUpdated() {
    if (!this.region) return;
    const simulator = Simulator.getInstance();
    const products = simulator.getProductsInRegion(this._region.id);
    products!.forEach((product) => {
      const h = simulator.getHistories().get(product.id)!;
      const last = h[h.length - 1];
      this.data.push({
        name: product.name,
        buyFactor: last,
        percentDiff: (last - h[h.length - 2]) / h[h.length - 2],
      });
    });
  }
}
