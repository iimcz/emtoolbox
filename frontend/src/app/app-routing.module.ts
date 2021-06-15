import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ClientDetailComponent } from './client-detail/client-detail.component';
import { ClientListComponent } from './client-list/client-list.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'client-list',
    pathMatch: 'full'
  },
  {
    path: 'client-list',
    component: ClientListComponent
  },
  {
    path: 'client',
    component: ClientDetailComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
