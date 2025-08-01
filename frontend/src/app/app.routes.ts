import { Routes } from '@angular/router';
import { DiscoveryComponent } from './components/discovery/discovery.component';
import { FavoritesComponent } from './components/favorites/favorites.component';

export const routes: Routes = [
  { path: '', redirectTo: '/discovery', pathMatch: 'full' },
  { path: 'discovery', component: DiscoveryComponent },
  { path: 'favorites', component: FavoritesComponent },
  { 
    path: 'auth/success', 
    loadComponent: () => import('./components/auth-callback/auth-callback.component').then(m => m.AuthCallbackComponent)
  },
  { 
    path: 'auth/error', 
    loadComponent: () => import('./components/auth-callback/auth-callback.component').then(m => m.AuthCallbackComponent)
  },
  { path: '**', redirectTo: '/discovery' }
];
