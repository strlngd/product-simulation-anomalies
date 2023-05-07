import { Component, ElementRef, ViewChild, OnInit } from '@angular/core';
import { Region } from '../models/region';
import { Point } from '../models/point';

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
  tooltip: { x: number; y: number; visible: boolean; text: string } = {
    x: 0,
    y: 0,
    visible: false,
    text: '',
  };

  ngAfterViewInit() {
    const regions: Region[] = [
      {
        id: '1',
        name: 'Produce',
        points: [
          { x: 609, y: 97 },
          { x: 744, y: 97 },
          { x: 744, y: 297 },
          { x: 609, y: 297 },
        ],
      },
      {
        id: '2',
        name: 'Bakery',
        points: [
          { x: 10, y: 10 },
          { x: 100, y: 100 },
          { x: 10, y: 100 },
        ],
      },
      {
        id: '3',
        name: 'Floral',
        points: [
          { x: 609, y: 325 },
          { x: 700, y: 300 },
          { x: 700, y: 385 },
          { x: 609, y: 410 },
        ],
      },
    ];
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
    this.tooltip.text = 'Click for more details...';
    this.tooltip.visible = true;
  }

  handleMouseClick(e: MouseEvent) {
    const x = e.offsetX;
    const y = e.offsetY;
    const region = this.getRegionFromPoint(x, y);
    if (!region) return;
    this.tooltip.text = `Clicked ${region.name}`;
  }

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
