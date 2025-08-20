import { Routes } from '@angular/router';
import { DiscoveryComponent } from './components/discovery/discovery.component';
import { FavoritesComponent } from './components/favorites/favorites.component';
import { SubscriptionComponent } from './components/subscription/subscription.component';
import { PaymentSuccessComponent } from './components/payment-success/payment-success.component';
import { PaymentCancelComponent } from './components/payment-cancel/payment-cancel.component';

export const routes: Routes = [
  { path: '', redirectTo: '/discovery', pathMatch: 'full' },
  { path: 'discovery', component: DiscoveryComponent },
  { path: 'favorites', component: FavoritesComponent },
  { path: 'subscription', component: SubscriptionComponent },
  { path: 'subscription/success', component: PaymentSuccessComponent },
  { path: 'subscription/cancel', component: PaymentCancelComponent },
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
