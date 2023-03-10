import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatGridListModule } from '@angular/material/grid-list';
import { ClientListComponent } from './client-list/client-list.component';
import { HttpClientModule } from '@angular/common/http';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatMenuModule } from '@angular/material/menu';
import { API_BASE_URL } from './services/api.generated.service';
import { environment } from 'src/environments/environment';
import { WS_BASE_URL } from './services/event-socket.service';
import { ClientDetailComponent } from './client-detail/client-detail.component';
import { ExpositionModule } from './exposition/exposition.module';
import { ExpositionBrowserComponent } from './exposition-browser/exposition-browser.component';
import { ExpositionEditorComponent } from './exposition-editor/exposition-editor.component';
import { MatInputModule } from '@angular/material/input';
import { InventoryModule } from './inventory/inventory.module';
import { OverlaysModule } from './overlays/overlays.module';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSelectModule } from '@angular/material/select';

@NgModule({
  declarations: [
    AppComponent,
    ClientListComponent,
    ClientDetailComponent,
    ExpositionBrowserComponent,
    ExpositionEditorComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    HttpClientModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatSidenavModule,
    MatCardModule,
    MatListModule,
    MatGridListModule,
    ExpositionModule,
    InventoryModule,
    OverlaysModule,
    MatMenuModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatTabsModule,
    MatSelectModule,
  ],
  providers: [
    { provide: API_BASE_URL, useValue: environment.apiBaseUrl },
    { provide: WS_BASE_URL, useValue: environment.wsBaseUrl },
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
