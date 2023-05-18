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
  public readonly historyStorageAmount = 100;

  // Lookups
  public regions: Map<string, Region> = new Map<string, Region>();
  public products: Map<string, Product> = new Map<string, Product>();
  public regionProducts: Map<string, Product[]> = new Map<string, Product[]>();

  // Simulation
  public productHistories: Map<string, number[]> = new Map<string, number[]>();
  public simulationCount: number = 0;

  private readonly _simThreshold: number = 3; // Used to help prevent products from going too far above or below buy_factor.
  private readonly _refresh: BehaviorSubject<boolean> =
    new BehaviorSubject<boolean>(false);

  private _isInitialized: boolean = false;
  private _anomalies$: Observable<AnomalyData[]> | undefined;
  private _lastAnomalyComputation: number = NaN;

  constructor(private http: HttpClient) {
    // Data injected from parsed internal regions JSON file
    const regions: Region[] = Array.from<Region>(regionsJson);
    regions.forEach((region) => {
      this.regions.set(region.id, region);
    });

    // Data injected from parsed internal products JSON file
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
    if (this._isInitialized) return;

    // Treat initialization as a simulation
    this.simulationCount++;

    // Since we want to keep the original buy_factor in the first simulation, we simulate storageAmount - 1 times
    this.simulateNext(this.historyStorageAmount - 1);

    this._isInitialized = true;
  }

  /**
   * Gets refresh Observable for subscriptions that update views or handle other logic.
   * @returns refresh Observable
   */
  public getRefresh(): Observable<boolean> {
    return this._refresh.asObservable();
  }

  /**
   * Produce new refresh value.
   * @param value
   */
  public setRefresh(value: boolean): void {
    this._refresh.next(value);
  }

  public getHistories(): Map<string, number[]> {
    return this.productHistories;
  }

  public getProductsInRegion(regionId: string): Product[] | undefined {
    return this.regionProducts.get(regionId);
  }

  public getRegionFromProductId(productId: string): Region | undefined {
    const region_id = this.products.get(productId)?.region_id;
    return region_id ? this.regions.get(region_id) : undefined;
  }

  private clampPosNeg(value: number, absMin: number, absMax: number) {
    const newValue = Math.max(absMin, Math.min(absMax, Math.abs(value)));
    return value < 0 ? newValue * -1 : newValue;
  }

  /**
   * Simulates the next n values
   * Uses Monte carlo simulation with a Geometric Brownian Motion (GBM) model
   * @param n The number of simulated values to calculate.
   */
  public simulateNext(n: number): void {
    for (let i = 0; i < n; i++) {
      this.simulateNextInternal();
    }
    this.setRefresh(true);
  }

  private simulateNextInternal(): void {
    for (const product of this.products.values()) {
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

      const lastAmount = history[history.length - 1];

      // Calculate percent change between amounts in history...
      const percentChange: number[] = [];
      for (let i = 1; i < history.length; i++) {
        percentChange.push((history[i] - history[i - 1]) / history[i - 1]);
      }

      // Values are clamped to prevent variance from becoming too low or too high
      let meanPercentChange = this.clampPosNeg(mean(percentChange)!, 0.01, 0.2);
      const stdDevChange = this.clampPosNeg(
        deviation(percentChange)!,
        0.05,
        0.35
      );

      // The normalized comulative deviation used in calculating the shock to be applied in simulating
      let shockNormalDev = Math.random();

      // Try to push direction back towards the original buy_factor if too low or high
      if (lastAmount > product.buy_factor * this._simThreshold) {
        shockNormalDev = shockNormalDev * (0.33 - 0.15) + 0.15; // Force value between 0.15 and 0.33 (force simulate dip)
        meanPercentChange = Math.abs(meanPercentChange) * -1;
      } else if (lastAmount < product.buy_factor / this._simThreshold) {
        shockNormalDev = shockNormalDev * (0.85 - 0.66) + 0.66; // Force value between 0.66 and 0.85 (force simulate peak)
        meanPercentChange = Math.abs(meanPercentChange);
      }

      const amount = this.simulateAmount(
        lastAmount,
        meanPercentChange,
        stdDevChange,
        shockNormalDev
      );

      while (history.length >= this.historyStorageAmount) history.shift();

      history.push(amount);
      this.productHistories.set(product.id, history);
    }
    this.simulationCount++;
  }

  private simulateAmount(
    currAmount: number,
    meanChange: number,
    stdDevChange: number,
    shockNormalDev: number
  ): number {
    const drift = meanChange - (stdDevChange * stdDevChange) / 2;
    let shock = stdDevChange * normSinv(shockNormalDev)!;

    return currAmount * Math.exp(drift + shock);
  }

  /**
   * Calculates the total number of anomalies for each region.
   * @returns A Map where the key is the Region and the value is the number of anomalies for that region
   */
  public getLastAnomaliesForRegions(): Observable<Map<Region, number>> {
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

  /**
   * Retrieves all anomalies for all products.
   * @returns an Observable AnomalyData array containing the AnomalyData for each product
   */
  public getAllAnomalies(): Observable<AnomalyData[]> {
    if (
      !this._anomalies$ ||
      this._lastAnomalyComputation != this.simulationCount
    ) {
      this._anomalies$ = this.computeAnomalies();
      this._lastAnomalyComputation = this.simulationCount;
    }
    return this._anomalies$;
  }

  /**
   * Retreives all anomalies for a given product.
   * @param productId
   * @returns an Observable with the AnomalyData or undefined if the product does not exist
   */
  public getProductAnomalies(
    productId: string
  ): Observable<AnomalyData | undefined> {
    return this.getAllAnomalies().pipe(
      map((data: AnomalyData[]) => {
        const anomaly_indices = data.find(
          (a: AnomalyData) => a.id == productId
        );
        return anomaly_indices;
      })
    );
  }

  /**
   * Makes a POST request to the simulation API to compute the anomlies of all supplied product histories.
   * @returns AnomalyData array
   */
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
