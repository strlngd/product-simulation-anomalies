import { Product } from '../models/product';
import { normSinv } from './normSinv';
import { Region } from '../models/region';
import { deviation, mean } from 'd3';
import * as productsJson from '../../data/products.json';
import * as regionsJson from '../../data/regions.json';

/**
 * (Singleton) Simulates purchase amounts
 */
export class Simulator {
  private static instance: Simulator;

  // Lookups
  regions: Map<string, Region> = new Map<string, Region>();
  products: Map<string, Product> = new Map<string, Product>();
  regionProducts: Map<string, Product[]> = new Map<string, Product[]>();

  // Simulation
  productHistories: Map<string, number[]> = new Map<string, number[]>();
  private _simThreshold: number = 3; // Used to help prevent products from going too far above or below buy_factor.

  constructor() {
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

  public static getInstance(): Simulator {
    if (!Simulator.instance) Simulator.instance = new Simulator();
    return Simulator.instance;
  }

  getHistories(): Map<string, number[]> {
    return this.productHistories;
  }

  getProductsInRegion(regionId: string): Product[] | undefined {
    return this.regionProducts.get(regionId);
  }

  simulateNext() {
    for (const product of this.products.values()) {
      // Use monte carlo simulation with Geometric Brownian Motion (GBM) model
      // Links: https://rosettacode.org/wiki/Monte_Carlo_methods https://dlibin.net/posts/stock-market-simulation-javascript

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

      let meanChange = mean(percentChange)!;
      const stdDevChange = deviation(percentChange)!;

      // Try to push mean direction back towards the original buy_factor
      const last = history[history.length - 1];
      if (last > product.buy_factor * this._simThreshold) {
        meanChange = -Math.abs(meanChange);
      } else if (last < product.buy_factor / this._simThreshold) {
        meanChange = Math.abs(meanChange);
      }

      // Attempt to generate large rise or fall (spike) at random. Not guaranteed if meanChange is very close to zero.
      const forceAnomaly = Math.floor(Math.random() * 50) == 0;
      if (forceAnomaly) meanChange *= 5;

      const amount = this.simulateAmount(
        history[history.length - 1],
        meanChange,
        stdDevChange
      );

      while (history.length >= 100) history.shift();

      history.push(amount);
      this.productHistories.set(product.id, history);

      // const change =
      //   (history[history.length - 1] - history[history.length - 2]) /
      //   history[history.length - 2];
      // if (change > 0.1 || change < -0.1) {
      // console.log('history', history);
      //   console.log('change percentage:', change);
      // }
    }
  }

  simulateAmount(currAmount: number, meanChange: number, stdDevChange: number) {
    const rand = Math.random();
    const drift = meanChange - (stdDevChange * stdDevChange) / 2;
    const randomShock = stdDevChange * normSinv(rand)!;
    return currAmount * Math.exp(drift + randomShock);
  }
}
