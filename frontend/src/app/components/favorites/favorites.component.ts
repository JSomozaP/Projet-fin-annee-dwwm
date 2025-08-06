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

  // Modal de confirmation de suppression
  showDeleteConfirmation = false;
  streamerToDelete: string | null = null;
  streamerNameToDelete: string | null = null;

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

  // Ouvrir le modal de confirmation avant suppression
  openDeleteConfirmation(streamerId: string, streamerName: string): void {
    this.streamerToDelete = streamerId;
    this.streamerNameToDelete = streamerName;
    this.showDeleteConfirmation = true;
  }

  // Confirmer la suppression
  confirmDeleteFavorite(): void {
    if (this.streamerToDelete) {
      this.favoriteService.removeFavorite(this.streamerToDelete).subscribe({
        next: () => {
          console.log('✅ Favori supprimé avec succès');
          this.closeDeleteConfirmation();
        },
        error: (error) => {
          console.error('❌ Erreur suppression favori:', error);
          this.error = 'Erreur lors de la suppression du favori';
          this.closeDeleteConfirmation();
        }
      });
    }
  }

  // Annuler la suppression
  cancelDeleteFavorite(): void {
    this.closeDeleteConfirmation();
  }

  // Fermer le modal
  closeDeleteConfirmation(): void {
    this.showDeleteConfirmation = false;
    this.streamerToDelete = null;
    this.streamerNameToDelete = null;
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
    // Trouver le favori pour récupérer ses informations
    const favorite = this.favorites.find(f => f.streamer_name === streamerName);
    
    if (!favorite) {
      console.error('Favori non trouvé pour:', streamerName);
      return;
    }

    // Rediriger vers la page discovery
    this.router.navigate(['/discovery']).then(() => {
      // Attendre que la page soit chargée puis envoyer les informations du stream
      setTimeout(() => {
        // Utiliser le StreamService pour ouvrir le stream dans l'application
        const streamData = {
          streamerId: favorite.streamer_id,
          streamerName: favorite.streamer_name,
          titre: `Stream de ${favorite.displayName || favorite.streamer_name}`,
          jeu: favorite.currentGame || 'Non spécifié',
          categorie: favorite.currentGame || 'Non spécifié',
          langue: 'fr', // Langue par défaut
          nbViewers: favorite.viewerCount || 0,
          thumbnailUrl: `https://static-cdn.jtvnw.net/previews-ttv/live_user_${favorite.streamer_name}-640x360.jpg`,
          embedUrl: `https://player.twitch.tv/?channel=${favorite.streamer_name}&parent=localhost`
        };

        // Utiliser un événement personnalisé pour communiquer avec le composant discovery
        const event = new CustomEvent('openStreamFromFavorite', {
          detail: { streamData }
        });
        window.dispatchEvent(event);
        
        console.log(`🎬 Ouverture du stream ${favorite.streamer_name} depuis les favoris`);
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
    
    // Utiliser les nouvelles propriétés enrichies avec fallbacks sécurisés
    const displayName = favorite.displayName || favorite.streamer_name || 'Nom indisponible';
    const streamerUsername = favorite.streamer_name || 'unknown';
    const avatarUrl = favorite.profileImageUrl || favorite.streamer_avatar || this.getDefaultAvatar(streamerUsername);
    const defaultAvatarFallback = this.getDefaultAvatar(streamerUsername);
    const description = favorite.description && favorite.description !== 'Aucune description' ? favorite.description : 'Aucune description disponible';
    
    // Gestion du jeu actuel selon les suggestions
    let gameStatus = '';
    if (favorite.isLive && favorite.currentGame) {
      gameStatus = favorite.currentGame;
    } else if (favorite.isLive) {
      gameStatus = 'En direct (jeu non spécifié)';
    } else {
      gameStatus = 'Pas en stream pour le moment';
    }
    
    const viewerCount = favorite.isLive && favorite.viewerCount ? this.formatNumber(favorite.viewerCount) : '';
    
    // Gestion sécurisée de la date
    let formattedDate = 'Date inconnue';
    try {
      if (favorite.created_at) {
        formattedDate = this.formatDate(favorite.created_at);
      }
    } catch (error) {
      console.warn('Erreur formatage date:', error);
      formattedDate = 'Date invalide';
    }
    
    modal.innerHTML = `
      <div class="modal-overlay" onclick="this.parentElement.remove()">
        <div class="modal-content" onclick="event.stopPropagation()">
          <div class="modal-header">
            <h3>📺 ${displayName}</h3>
            <button class="modal-close" onclick="this.closest('.streamer-info-modal').remove()">×</button>
          </div>
          <div class="modal-body">
            <div class="streamer-avatar-large">
              <img src="${avatarUrl}" alt="${displayName}" onerror="this.src='${defaultAvatarFallback}'">
              ${favorite.isLive ? '<div class="live-badge">🔴 EN DIRECT</div>' : '<div class="offline-badge">⚫ HORS LIGNE</div>'}
            </div>
            <div class="streamer-details">
              <p><strong>Nom du streamer:</strong> ${displayName}</p>
              <p><strong>Description:</strong> ${description}</p>
              <p><strong>Jeu actuel:</strong> ${gameStatus}</p>
              <p><strong>Statut:</strong> ${favorite.isLive ? 'En direct' : 'Hors ligne'}</p>
              ${favorite.isLive && viewerCount ? `<p><strong>Spectateurs actuels:</strong> ${viewerCount}</p>` : ''}
              <p><strong>Ajouté aux favoris le:</strong> ${formattedDate}</p>
              <p><strong>Lien Twitch:</strong> <a href="https://www.twitch.tv/${streamerUsername}" target="_blank">twitch.tv/${streamerUsername}</a></p>
            </div>
          </div>
          <div class="modal-actions">
            ${favorite.isLive ? 
              `<button class="btn btn-primary" onclick="window.open('https://www.twitch.tv/${streamerUsername}', '_blank')">📺 Regarder sur Twitch</button>` :
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

  // Génère un avatar par défaut avec les initiales du nom
  getDefaultAvatar(name: string): string {
    if (!name) return this.generateAvatarUrl('?');
    
    const initials = name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
    
    return this.generateAvatarUrl(initials || name.charAt(0).toUpperCase());
  }

  // Génère une URL d'avatar avec initiales colorées
  private generateAvatarUrl(text: string): string {
    const colors = [
      '#667eea', '#764ba2', '#f093fb', '#f5576c', 
      '#4facfe', '#00f2fe', '#43e97b', '#38f9d7',
      '#ffecd2', '#fcb69f', '#a8edea', '#fed6e3'
    ];
    
    const colorIndex = text.charCodeAt(0) % colors.length;
    const backgroundColor = colors[colorIndex];
    
    // Génère une image SVG en base64
    const svg = `
      <svg width="80" height="80" xmlns="http://www.w3.org/2000/svg">
        <rect width="80" height="80" fill="${backgroundColor}"/>
        <text x="40" y="48" font-family="Arial, sans-serif" font-size="24" 
              font-weight="bold" text-anchor="middle" fill="white">${text}</text>
      </svg>
    `;
    
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }

  // Gère les erreurs de chargement d'image
  onImageError(event: any, name: string): void {
    // Évite la boucle infinie en définissant une nouvelle source
    event.target.src = this.getDefaultAvatar(name);
    // Supprime l'événement d'erreur pour éviter la récursion
    event.target.onerror = null;
  }

  formatNumber(num: number): string {
    if (!num) return '0';
    
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    
    return num.toLocaleString();
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}
