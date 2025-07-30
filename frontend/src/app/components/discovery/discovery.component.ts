import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { StreamService, Stream } from '../../services/stream.service';
import { FavoriteService } from '../../services/favorite.service';
import { AuthService } from '../../services/auth.service';
import { StreamViewerComponent } from '../stream-viewer/stream-viewer.component';

@Component({
  selector: 'app-discovery',
  standalone: true,
  imports: [CommonModule, StreamViewerComponent],
  templateUrl: './discovery.component.html',
  styleUrl: './discovery.component.scss'
})
export class DiscoveryComponent implements OnInit, OnDestroy {
  currentStream: Stream | null = null;
  isLoading = false;
  error: string | null = null;
  isAuthenticated = false;
  isFavorite = false;
  isWatchingStream = false; // Nouvel état pour l'affichage du stream
  
  private subscriptions = new Subscription();

  // Injection des services avec le nouveau système
  private streamService = inject(StreamService);
  private favoriteService = inject(FavoriteService);
  private authService = inject(AuthService);

  ngOnInit() {
    this.subscriptions.add(
      this.authService.isAuthenticated$.subscribe(
        isAuth => this.isAuthenticated = isAuth
      )
    );
    
    // Découvrir un premier stream automatiquement
    this.discoverStream();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  async discoverStream() {
    if (this.isLoading) return;
    
    this.isLoading = true;
    this.error = null;
    
    try {
      this.streamService.discoverStream().subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.currentStream = response.data;
            if (this.isAuthenticated) {
              this.checkIfFavorite();
            }
          } else {
            this.error = 'Aucun stream trouvé';
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Erreur lors de la découverte:', error);
          this.error = error.message || 'Erreur lors de la découverte du stream';
          this.isLoading = false;
        }
      });
    } catch (error: any) {
      console.error('Erreur lors de la découverte:', error);
      this.error = error.message || 'Erreur lors de la découverte du stream';
      this.isLoading = false;
    }
  }

  private checkIfFavorite() {
    if (!this.currentStream) return;
    
    this.favoriteService.getFavorites().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.isFavorite = response.data.some((fav: any) => fav.streamer_id === this.currentStream!.streamerId);
        }
      },
      error: (error) => {
        console.error('Erreur lors de la vérification des favoris:', error);
      }
    });
  }

  toggleFavorite() {
    if (!this.currentStream || !this.isAuthenticated) return;
    
    if (this.isFavorite) {
      this.favoriteService.removeFavorite(this.currentStream.streamerId).subscribe({
        next: (response) => {
          if (response.success) {
            this.isFavorite = false;
          } else {
            this.error = 'Erreur lors de la suppression du favori';
          }
        },
        error: (error) => {
          console.error('Erreur lors de la suppression du favori:', error);
          this.error = error.message || 'Erreur lors de la suppression du favori';
        }
      });
    } else {
      this.favoriteService.addFavorite(
        this.currentStream.streamerId,
        this.currentStream.streamerName,
        this.currentStream.jeu
      ).subscribe({
        next: (response) => {
          if (response.success) {
            this.isFavorite = true;
          } else {
            this.error = 'Erreur lors de l\'ajout du favori';
          }
        },
        error: (error) => {
          console.error('Erreur lors de l\'ajout du favori:', error);
          this.error = error.message || 'Erreur lors de l\'ajout du favori';
        }
      });
    }
  }

  formatViewerCount(count: number): string {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  }

  openStream() {
    if (!this.currentStream) return;
    
    // Passer en mode viewing au lieu d'ouvrir dans un nouvel onglet
    this.isWatchingStream = true;
  }

  closeStreamViewer() {
    this.isWatchingStream = false;
  }
}
