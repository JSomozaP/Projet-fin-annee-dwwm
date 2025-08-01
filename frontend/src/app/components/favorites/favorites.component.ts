import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { FavoriteService, Favorite } from '../../services/favorite.service';
import { AuthService } from '../../services/auth.service';
import { StreamService } from '../../services/stream.service';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './favorites.component.html',
  styleUrl: './favorites.component.scss'
})
export class FavoritesComponent implements OnInit, OnDestroy {
  favorites: Favorite[] = [];
  isLoading = false;
  isAuthenticated = false;
  error: string | null = null;

  private destroy$ = new Subject<void>();
  private favoriteService = inject(FavoriteService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private streamService = inject(StreamService);

  ngOnInit(): void {
    // Vérifier l'authentification
    this.authService.isAuthenticated$
      .pipe(takeUntil(this.destroy$))
      .subscribe(isAuth => {
        this.isAuthenticated = isAuth;
        if (isAuth) {
          this.loadFavorites();
        }
      });

    // Écouter les changements de favoris
    this.favoriteService.favorites$
      .pipe(takeUntil(this.destroy$))
      .subscribe(favorites => {
        this.favorites = favorites;
      });

    // Écouter l'état de chargement
    this.favoriteService.loading$
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => {
        this.isLoading = loading;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadFavorites(): void {
    this.favoriteService.loadFavorites();
  }

  removeFavorite(streamerId: string): void {
    this.favoriteService.removeFavorite(streamerId).subscribe({
      next: () => {
        console.log('✅ Favori supprimé avec succès');
      },
      error: (error) => {
        console.error('❌ Erreur suppression favori:', error);
        this.error = 'Erreur lors de la suppression du favori';
      }
    });
  }

  watchStreamer(streamerName: string): void {
    // Rediriger vers la découverte puis ouvrir le stream-viewer
    this.router.navigate(['/discovery']).then(() => {
      // Utiliser le service de stream pour ouvrir le stream
      setTimeout(() => {
        // Simuler l'ouverture d'un stream dans l'app
        const streamViewerElement = document.querySelector('app-stream-viewer');
        if (streamViewerElement) {
          // Si le stream-viewer existe déjà, le mettre à jour
          // Cette logique sera améliorée avec un service partagé
        }
        
        // Pour l'instant, ouvrir dans un nouvel onglet avec une URL propre
        window.open(`https://www.twitch.tv/${streamerName}?parent=localhost`, '_blank');
      }, 100);
    });
  }

  getStreamerInfo(streamerName: string): void {
    // Afficher les informations détaillées du streamer
    const favorite = this.favorites.find(f => f.streamer_name === streamerName);
    
    if (favorite) {
      const infoModal = this.createInfoModal(favorite);
      document.body.appendChild(infoModal);
    }
  }

  private createInfoModal(favorite: Favorite): HTMLElement {
    const modal = document.createElement('div');
    modal.className = 'streamer-info-modal';
    modal.innerHTML = `
      <div class="modal-overlay" onclick="this.parentElement.remove()">
        <div class="modal-content" onclick="event.stopPropagation()">
          <div class="modal-header">
            <h3>📺 ${favorite.streamer_name}</h3>
            <button class="modal-close" onclick="this.closest('.streamer-info-modal').remove()">×</button>
          </div>
          <div class="modal-body">
            <div class="streamer-avatar-large">
              <img src="${favorite.streamer_avatar || '/assets/default-avatar.svg'}" alt="${favorite.streamer_name}">
              ${favorite.isLive ? '<div class="live-badge">🔴 EN LIVE</div>' : '<div class="offline-badge">⚫ HORS LIGNE</div>'}
            </div>
            <div class="streamer-details">
              <p><strong>Nom du streamer:</strong> ${favorite.streamer_name}</p>
              <p><strong>Jeu actuel:</strong> ${favorite.game_name || 'Non spécifié'}</p>
              <p><strong>Statut:</strong> ${favorite.isLive ? 'En ligne' : 'Hors ligne'}</p>
              <p><strong>Ajouté le:</strong> ${new Date(favorite.created_at).toLocaleDateString('fr-FR')}</p>
              <p><strong>Lien Twitch:</strong> <a href="https://www.twitch.tv/${favorite.streamer_name}" target="_blank">twitch.tv/${favorite.streamer_name}</a></p>
            </div>
          </div>
          <div class="modal-actions">
            ${favorite.isLive ? 
              `<button class="btn btn-primary" onclick="window.open('https://www.twitch.tv/${favorite.streamer_name}', '_blank')">📺 Regarder sur Twitch</button>` :
              '<button class="btn btn-secondary" disabled>Streamer hors ligne</button>'
            }
            <button class="btn btn-secondary" onclick="this.closest('.streamer-info-modal').remove()">Fermer</button>
          </div>
        </div>
      </div>
    `;

    // Ajouter les styles du modal
    const style = document.createElement('style');
    style.textContent = `
      .streamer-info-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 9999;
      }
      .modal-overlay {
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 2rem;
      }
      .modal-content {
        background: white;
        border-radius: 1rem;
        max-width: 500px;
        width: 100%;
        max-height: 80vh;
        overflow-y: auto;
      }
      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1.5rem 1.5rem 0;
        border-bottom: 1px solid #eee;
        margin-bottom: 1.5rem;
      }
      .modal-close {
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        padding: 0.5rem;
      }
      .modal-body {
        padding: 0 1.5rem;
      }
      .streamer-avatar-large {
        text-align: center;
        margin-bottom: 1.5rem;
        position: relative;
      }
      .streamer-avatar-large img {
        width: 100px;
        height: 100px;
        border-radius: 50%;
        object-fit: cover;
      }
      .live-badge, .offline-badge {
        margin-top: 0.5rem;
        padding: 0.3rem 0.8rem;
        border-radius: 1rem;
        font-size: 0.8rem;
        font-weight: bold;
      }
      .live-badge {
        background: #ff0000;
        color: white;
      }
      .offline-badge {
        background: #666;
        color: white;
      }
      .streamer-details p {
        margin: 0.8rem 0;
        color: #333;
      }
      .modal-actions {
        padding: 1.5rem;
        display: flex;
        gap: 1rem;
        justify-content: flex-end;
        border-top: 1px solid #eee;
        margin-top: 1.5rem;
      }
      .modal-actions .btn {
        padding: 0.75rem 1.5rem;
        border: none;
        border-radius: 0.5rem;
        cursor: pointer;
        font-weight: 600;
      }
      .modal-actions .btn-primary {
        background: #667eea;
        color: white;
      }
      .modal-actions .btn-secondary {
        background: #6c757d;
        color: white;
      }
      .modal-actions .btn:disabled {
        background: #ccc;
        cursor: not-allowed;
      }
    `;
    modal.appendChild(style);

    return modal;
  }

  goToDiscovery(): void {
    this.router.navigate(['/discovery']);
  }

  login(): void {
    this.authService.redirectToTwitchAuth();
  }

  clearError(): void {
    this.error = null;
  }
}
