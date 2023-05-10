import { Region } from './region';

export interface Product {
  id: string;
  name: string;
  region_id: string;
  buy_factor: number;
}
