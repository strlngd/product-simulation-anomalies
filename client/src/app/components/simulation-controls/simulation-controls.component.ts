import { Component } from '@angular/core';
import { SimulatorService } from '../../services/simulator.service';

@Component({
  selector: 'app-simulation-controls',
  templateUrl: './simulation-controls.component.html',
  styleUrls: ['./simulation-controls.component.css'],
})
export class SimulationControlsComponent {
  constructor(private _simulatorService: SimulatorService) {}

  simulateNext(value: string) {
    const n = parseInt(value, 10);
    if (!n) return;
    this._simulatorService.simulateNext(n);
  }
}
