import { Region } from './region';

export interface Product {
  id: string;
  name: string;
  region: Region;
  buy_factor: number;
}
