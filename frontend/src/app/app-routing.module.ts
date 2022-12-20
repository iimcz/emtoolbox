import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ClientDetailComponent } from './client-detail/client-detail.component';
import { ClientListComponent } from './client-list/client-list.component';
import { ExpositionBrowserComponent } from './exposition-browser/exposition-browser.component';
import { ExpositionEditorComponent } from './exposition-editor/exposition-editor.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'expositions',
    pathMatch: 'full'
  },
  {
    path: 'expositions',
    component: ExpositionBrowserComponent,
  },
  {
    path: 'exposition/:id',
    component: ExpositionEditorComponent,
  },
  {
    path: 'exhibits',
    component: ClientListComponent
  },
  {
    path: 'exhibit/:id',
    component: ClientDetailComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
