import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { FavoriteService, Favorite } from '../../services/favorite.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-favorites',
  imports: [CommonModule, RouterLink],
  templateUrl: './favorites.component.html',
  styleUrl: './favorites.component.scss'
})
export class FavoritesComponent implements OnInit, OnDestroy {
  favorites: Favorite[] = [];
  isLoading = false;
  error: string | null = null;
  isAuthenticated = false;
  
  private subscriptions = new Subscription();

  constructor(
    private favoriteService: FavoriteService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.subscriptions.add(
      this.authService.isAuthenticated$.subscribe(
        isAuth => {
          this.isAuthenticated = isAuth;
          if (isAuth) {
            this.loadFavorites();
          } else {
            this.favorites = [];
          }
        }
      )
    );
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  loadFavorites() {
    if (!this.isAuthenticated) return;
    
    this.isLoading = true;
    this.error = null;
    
    this.favoriteService.getFavorites().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.favorites = response.data;
        } else {
          this.error = 'Impossible de charger les favoris';
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des favoris:', error);
        this.error = error.message || 'Erreur lors du chargement des favoris';
        this.isLoading = false;
      }
    });
  }

  removeFavorite(streamerId: string) {
    if (!this.isAuthenticated) return;
    
    this.favoriteService.removeFavorite(streamerId).subscribe({
      next: (response) => {
        if (response.success) {
          this.favorites = this.favorites.filter(fav => fav.streamerId !== streamerId);
        } else {
          this.error = 'Erreur lors de la suppression du favori';
        }
      },
      error: (error) => {
        console.error('Erreur lors de la suppression du favori:', error);
        this.error = error.message || 'Erreur lors de la suppression du favori';
      }
    });
  }

  openStreamerChannel(streamerName: string) {
    const twitchUrl = `https://www.twitch.tv/${streamerName.toLowerCase()}`;
    window.open(twitchUrl, '_blank');
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }
}
