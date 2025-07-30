import { Routes } from '@angular/router';
import { DiscoveryComponent } from './components/discovery/discovery.component';
import { FavoritesComponent } from './components/favorites/favorites.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/discovery',
    pathMatch: 'full'
  },
  {
    path: 'discovery',
    component: DiscoveryComponent,
    title: 'Découverte - Twitchscovery'
  },
  {
    path: 'favorites',
    component: FavoritesComponent,
    title: 'Mes Favoris - Twitchscovery'
  },
  {
    path: '**',
    redirectTo: '/discovery'
  }
];
