import { Component, ElementRef, ViewChild, OnInit } from '@angular/core';
import { Region } from '../models/region';
import { Point } from '../models/point';
import * as regionsJson from '../../data/regions.json';

@Component({
  selector: 'app-store-visualizer',
  templateUrl: './store-visualizer.component.html',
  styleUrls: ['./store-visualizer.component.css'],
})
export class StoreVisualizerComponent {
  @ViewChild('heatmapCanvas', { static: false }) heatmapCanvas!: ElementRef;
  @ViewChild('overlayDiv', { static: false }) overlayDiv!: ElementRef;

  ctx!: CanvasRenderingContext2D;
  readonly overlayAlpha: number = 0.25;
  width = 800;
  height = 600;

  readonly colors: string[] = ['#00FF00', '#FFFF00', '#FF8800', '#FF0000'];
  regionPaths: Map<Region, Path2D> = new Map<Region, Path2D>();
  selectedRegion!: Region;
  tooltip: {
    x: number;
    y: number;
    visible: boolean;
    title: string;
    content: string;
  } = {
    x: 0,
    y: 0,
    visible: false,
    title: '',
    content: '',
  };

  ngAfterViewInit() {
    const regions: Region[] = Array.from<Region>(regionsJson);
    // console.log(regions);
    const canvas = this.heatmapCanvas.nativeElement;
    this.ctx = canvas.getContext('2d');

    regions.forEach((region) => {
      const color = this.colors[Math.floor(Math.random() * 4)];
      this.drawRegionPoints(color, region.points);
      this.addRegionPath(region);
    });
  }

  /**
   * Helper function for getting the first region that contains a given point.
   * @param x
   * @param y
   * @returns The first region found or null otherwise.
   */
  getRegionFromPoint(x: number, y: number): Region | null {
    for (const region of this.regionPaths.keys()) {
      const path = this.regionPaths.get(region);
      if (path == undefined || !this.ctx.isPointInPath(path!, x, y)) continue;
      return region;
    }
    return null;
  }

  handleMouseMovement(e: MouseEvent) {
    const x = e.offsetX;
    const y = e.offsetY;
    const region = this.getRegionFromPoint(x, y);
    if (!region) {
      this.tooltip.visible = false;
      return;
    }
    this.tooltip.x = x;
    this.tooltip.y = y - this.overlayDiv.nativeElement.clientHeight;
    this.tooltip.title = region.name;
    this.tooltip.content = `Click for more details...`;
    this.tooltip.visible = true;
  }

  handleMouseClick(e: MouseEvent) {
    const x = e.offsetX;
    const y = e.offsetY;
    const region = this.getRegionFromPoint(x, y);
    if (!region) return;
    this.tooltip.title = region.name;
    this.tooltip.content = `Clicked ${region.name}`;
    this.selectedRegion = region;
  }

  // drawRegionRect(
  //   color: string,
  //   x: number,
  //   y: number,
  //   width: number,
  //   height: number
  // ) {
  //   this.ctx.fillStyle = color;
  //   this.ctx.globalAlpha = this.overlayAlpha;
  //   this.ctx.fillRect(x, y, width, height);
  //   this.ctx.globalAlpha = 1;
  // }

  drawRegionPoints(color: string, points: Point[]) {
    if (points.length < 3) return;
    this.ctx.fillStyle = color;
    this.ctx.globalAlpha = this.overlayAlpha;
    this.ctx.beginPath();
    points.forEach((p) => {
      this.ctx.lineTo(p.x, p.y);
    });
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.globalAlpha = 1;
  }

  addRegionPath(region: Region) {
    const path = new Path2D();
    region.points.forEach((p) => {
      path.lineTo(p.x, p.y);
    });
    path.closePath();
    this.regionPaths.set(region, path);
  }
}
