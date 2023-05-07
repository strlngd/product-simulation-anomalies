import { Component, Input } from '@angular/core';
import { Region } from 'src/app/models/region';

@Component({
  selector: 'app-region-details',
  templateUrl: './region-details.component.html',
  styleUrls: ['./region-details.component.css'],
})
export class RegionDetailsComponent {
  @Input() region!: Region;
}
