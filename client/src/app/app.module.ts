import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { StoreVisualizerComponent } from './store-visualizer/store-visualizer.component';
import { RegionDetailsComponent } from './store-visualizer/region-details/region-details.component';

@NgModule({
  declarations: [AppComponent, StoreVisualizerComponent, RegionDetailsComponent],
  imports: [BrowserModule, AppRoutingModule],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
