import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import 'hammerjs';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { fai1Component } from './fai-1/fai-1.component';
import { fai2Component } from './fai-2/fai-2.component';
import { fai3Component } from './fai-3/fai-3.component';
import { fai4Component } from './fai-4/fai-4.component';
import { fai5Component } from './fai-5/fai-5.component';
import { faiDialog } from './dialog/dialog';

import { RouterModule } from '@angular/router';
import { AppService } from './app.services';

@NgModule({
  declarations: [
    AppComponent,
    fai1Component,
    fai2Component,
    fai3Component,
    fai4Component,
    fai5Component,
    faiDialog
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,
    AppRoutingModule,
    BrowserAnimationsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
