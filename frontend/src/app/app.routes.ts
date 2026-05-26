import { Routes } from '@angular/router';
import { CarrierSetupComponent } from './features/carrier-setup/carrier-setup.component';
import { GenerateIdComponent } from './features/generate-id/generate-id.component';

export const routes: Routes = [
  { path: '', redirectTo: 'generate', pathMatch: 'full' },
  { path: 'generate', component: GenerateIdComponent },
  { path: 'setup', component: CarrierSetupComponent },
  { path: '**', redirectTo: 'generate' },
];
