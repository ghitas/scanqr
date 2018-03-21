import { NgModule }             from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { fai1Component }	from './fai-1/fai-1.component';
import { fai2Component }	from './fai-2/fai-2.component';
import { fai3Component }	from './fai-3/fai-3.component';
import { fai4Component }	from './fai-4/fai-4.component';
import { fai5Component }	from './fai-5/fai-5.component';

const routes: Routes = [
  { path: '', redirectTo: '/fai1', pathMatch: 'full' },
  { path: 'fai1', component: fai1Component },
  { path: 'fai2', component: fai2Component },
  { path: 'fai3', component: fai3Component },
  { path: 'fai4', component: fai4Component },
  { path: 'fai5', component: fai5Component },
];

@NgModule({
  imports: [ RouterModule.forRoot(routes) ],
  exports: [ RouterModule ]
})
export class AppRoutingModule {}

