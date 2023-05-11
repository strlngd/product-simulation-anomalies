import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { StoreVisualizerComponent } from './components/store-visualizer/store-visualizer.component';
import { RegionDetailsComponent } from './components/store-visualizer/region-details/region-details.component';
import { SimulationControlsComponent } from './components/simulation-controls/simulation-controls.component';
import { LineChartComponent } from './components/line-chart/line-chart.component';
import { HeaderComponent } from './components/header/header.component';

@NgModule({
  declarations: [
    AppComponent,
    StoreVisualizerComponent,
    RegionDetailsComponent,
    SimulationControlsComponent,
    LineChartComponent,
    HeaderComponent,
  ],
  imports: [BrowserModule, AppRoutingModule, HttpClientModule],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
