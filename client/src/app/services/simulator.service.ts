import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';

import { Product } from '../models/product';
import { normSinv } from '../util/normSinv';
import { Region } from '../models/region';
import { deviation, mean } from 'd3';
import * as productsJson from '../../data/products.json';
import * as regionsJson from '../../data/regions.json';
import { environment } from 'src/environments/environment';

type AnomalyData = { id: string; anomaly_indices: number[] };

@Injectable({
  providedIn: 'root',
})
export class SimulatorService {
  // Lookups
  regions: Map<string, Region> = new Map<string, Region>();
  products: Map<string, Product> = new Map<string, Product>();
  regionProducts: Map<string, Product[]> = new Map<string, Product[]>();

  // Simulation
  productHistories: Map<string, number[]> = new Map<string, number[]>();
  simulationCount: number = 1; // Start at 1 since we initialize with buy_factor
  public readonly historyStorageAmount = 100;
  private readonly _simThreshold: number = 3; // Used to help prevent products from going too far above or below buy_factor.

  constructor(private http: HttpClient) {
    const regions: Region[] = Array.from<Region>(regionsJson);
    regions.forEach((region) => {
      this.regions.set(region.id, region);
    });

    const productsArray: Product[] = Array.from(productsJson);
    productsArray.forEach((product) => {
      this.products.set(product.id, product as Product);
      const products = this.regionProducts.has(product.region_id)
        ? this.regionProducts.get(product.region_id)!
        : [];
      products?.push(product);
      this.regionProducts.set(product.region_id, products);
    });
  }

  /**
   * Initialize simulation data with initial values.
   */
  init() {
    this.simulateNext(99);
  }

  private refresh: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(
    false
  );

  getRefresh(): Observable<boolean> {
    return this.refresh.asObservable();
  }

  setRefresh(value: boolean): void {
    this.refresh.next(value);
  }

  getHistories(): Map<string, number[]> {
    return this.productHistories;
  }

  getProductsInRegion(regionId: string): Product[] | undefined {
    return this.regionProducts.get(regionId);
  }

  getRegionFromProductId(productId: string): Region | undefined {
    const region_id = this.products.get(productId)?.region_id;
    return region_id ? this.regions.get(region_id) : undefined;
  }

  simulateNext(amount: number): void {
    for (let i = 0; i < amount; i++) {
      this.simulateNextInternal();
    }
    this.setRefresh(true);
  }

  private clampPosNeg(value: number, absMin: number, absMax: number) {
    const newValue = Math.max(absMin, Math.min(absMax, Math.abs(value)));
    return value < 0 ? newValue * -1 : newValue;
  }

  private simulateNextInternal(): void {
    for (const product of this.products.values()) {
      // Monte carlo simulation with Geometric Brownian Motion (GBM) model
      const history = this.productHistories.has(product.id)
        ? this.productHistories.get(product.id)!
        : [
            // Initialize with 5 historical datapoints for simulation if none exist
            product.buy_factor,
            product.buy_factor + product.buy_factor * 0.05,
            product.buy_factor,
            product.buy_factor - product.buy_factor * 0.05,
            product.buy_factor,
          ];

      const percentChange: number[] = []; // calculate percent change between amounts in history...
      for (let i = 1; i < history.length; i++) {
        percentChange.push((history[i] - history[i - 1]) / history[i - 1]);
      }

      const lastAmount = history[history.length - 1];
      let meanPercentChange = this.clampPosNeg(mean(percentChange)!, 0.01, 0.2); // Prevent mean percent change from going too low
      const stdDevChange = this.clampPosNeg(
        deviation(percentChange)!,
        0.05,
        0.35
      ); // Prevent standard deviation from going too low.

      // Try to push direction back towards the original buy_factor
      let flipDirection: -1 | 0 | 1 = 0;
      if (lastAmount > product.buy_factor * this._simThreshold) {
        flipDirection = -1;
        meanPercentChange = Math.abs(meanPercentChange) * -1;
      } else if (lastAmount < product.buy_factor / this._simThreshold) {
        flipDirection = 1;
        meanPercentChange = Math.abs(meanPercentChange);
      }

      const amount = this.simulateAmount(
        lastAmount,
        meanPercentChange,
        stdDevChange,
        flipDirection
      );

      while (history.length >= this.historyStorageAmount) history.shift();

      history.push(amount);
      this.productHistories.set(product.id, history);
    }
    this.simulationCount++;
  }

  simulateAmount(
    currAmount: number,
    meanChange: number,
    stdDevChange: number,
    flipDirection: -1 | 0 | 1
  ): number {
    let rand = Math.random();
    if (flipDirection == -1) {
      rand = rand * (0.33 - 0.15) + 0.1;
    } else if (flipDirection == 1) {
      rand = rand * (0.85 - 0.66) + 0.66;
    }

    const drift = meanChange - (stdDevChange * stdDevChange) / 2;
    let randomShock = stdDevChange * normSinv(rand)!;

    return currAmount * Math.exp(drift + randomShock);
  }

  getLastAnomaliesForRegions(): Observable<Map<Region, number>> {
    return this.computeAnomalies().pipe(
      map((data: AnomalyData[]) => {
        const dataRegions = new Map<Region, number>();
        for (const anomalyData of data) {
          const region = this.getRegionFromProductId(anomalyData.id)!;
          if (dataRegions.has(region)) {
            const currentValue = dataRegions.get(region)!;
            dataRegions.set(
              region,
              currentValue + anomalyData.anomaly_indices.length
            );
          } else {
            dataRegions.set(region, anomalyData.anomaly_indices.length);
          }
        }
        return dataRegions;
      })
    );
  }

  private _anomalies: Observable<AnomalyData[]> | undefined;
  private _lastAnomalyComputation: number = NaN;

  getAllAnomalies(): Observable<AnomalyData[]> {
    if (
      !this._anomalies ||
      this._lastAnomalyComputation != this.simulationCount
    ) {
      this._anomalies = this.computeAnomalies();
      this._lastAnomalyComputation = this.simulationCount;
    }
    return this._anomalies;
  }

  getProductAnomalies(productId: string): Observable<AnomalyData | undefined> {
    return this.getAllAnomalies().pipe(
      map((data: AnomalyData[]) => {
        const anomaly_indices = data.find(
          (a: AnomalyData) => a.id == productId
        );
        return anomaly_indices;
      })
    );
  }

  private computeAnomalies(): Observable<AnomalyData[]> {
    const body = [];
    for (const product of this.products.values()) {
      body.push({
        id: product.id,
        buyFactor: product.buy_factor,
        history: this.productHistories.get(product.id),
      });
    }

    return this.http
      .post<AnomalyData[]>(
        environment.apiUrl + '/simulation/computeanomalies',
        body
      )
      .pipe(shareReplay());
  }
}
