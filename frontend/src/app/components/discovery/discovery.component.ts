import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { StreamService, Stream } from '../../services/stream.service';
import { FavoriteService } from '../../services/favorite.service';
import { AuthService } from '../../services/auth.service';
import { StreamViewerComponent } from '../stream-viewer/stream-viewer.component';

export interface StreamFilters {
  game?: string;
  language?: string;
  minViewers?: number;
  maxViewers?: number;
}

@Component({
  selector: 'app-discovery',
  standalone: true,
  imports: [CommonModule, FormsModule, StreamViewerComponent],
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
  
  // 📋 Historique slide panel
  showHistoryPanel = false;
  
  // Filtres de recherche
  filters: StreamFilters = {
    game: '',
    language: '',
    minViewers: undefined
  };
  
  // État des filtres (visible/caché)
  showFilters = false;
  
  // Suggestions de jeux
  gameSuggestions: string[] = [];
  showGameSuggestions = false;
  
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
            
            // 📝 Marquer automatiquement le stream comme vu
            this.streamService.markStreamAsViewed(this.currentStream);
            
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
    if (!this.currentStream || !this.isAuthenticated) {
      this.isFavorite = false;
      return;
    }
    
    this.favoriteService.getFavorites().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.isFavorite = response.data.some((fav: any) => fav.streamer_id === this.currentStream!.streamerId);
        }
      },
      error: (error) => {
        console.error('Erreur lors de la vérification des favoris:', error);
        this.isFavorite = false;
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

  openStream() {
    if (!this.currentStream) return;
    
    // Passer en mode viewing au lieu d'ouvrir dans un nouvel onglet
    this.isWatchingStream = true;
  }

  closeStreamViewer() {
    this.isWatchingStream = false;
  }

  // Nouvelles méthodes pour les filtres
  toggleFilters() {
    this.showFilters = !this.showFilters;
  }

  onFilterChange() {
    // Auto-recherche quand un filtre change (optionnel)
    // On peut commenter cette ligne si on préfère rechercher manuellement
    // this.discoverStreamWithFilters();
  }

  // Suggestions de jeux dynamiques
  onGameInputChange(value: string) {
    this.filters.game = value;
    
    if (value.length >= 2) {
      this.searchGamesFromAPI(value);
    } else {
      this.showGameSuggestions = false;
      this.gameSuggestions = [];
    }
  }

  searchGamesFromAPI(query: string) {
    this.streamService.searchGames(query).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.gameSuggestions = response.data;
          this.showGameSuggestions = this.gameSuggestions.length > 0;
        } else {
          this.showGameSuggestions = false;
          this.gameSuggestions = [];
        }
      },
      error: (error) => {
        console.error('Erreur lors de la recherche de jeux:', error);
        // En cas d'erreur, utiliser la recherche locale comme fallback
        this.updateGameSuggestionsLocal(query);
      }
    });
  }

  updateGameSuggestionsLocal(searchTerm: string) {
    // Liste étendue de jeux populaires sur Twitch (fallback)
    const popularGames = [
      'Just Chatting', 'League of Legends', 'Fortnite', 'Valorant', 'Minecraft',
      'Grand Theft Auto V', 'World of Warcraft', 'Counter-Strike 2', 'Apex Legends',
      'Call of Duty: Warzone', 'Dota 2', 'Overwatch 2', 'Rocket League', 
      'World of Tanks', 'World of Warships', 'Hearthstone', 'Dead by Daylight',
      'Among Us', 'Fall Guys', 'Genshin Impact', 'Lost Ark', 'New World',
      'Elden Ring', 'FIFA 24', 'Madden NFL 24', 'NBA 2K24', 'The Sims 4',
      'Rust', 'Escape from Tarkov', 'Rainbow Six Siege', 'PUBG', 'Destiny 2',
      'Path of Exile', 'Diablo IV', 'Starcraft II', 'Age of Empires IV',
      'Civilization VI', 'Total War', 'Chess', 'Teamfight Tactics', 'Legends of Runeterra',
      'Palworld', 'Baldur\'s Gate 3', 'Hogwarts Legacy', 'Spider-Man Remastered',
      'God of War', 'The Witcher 3', 'Cyberpunk 2077', 'Red Dead Redemption 2'
    ];

    this.gameSuggestions = popularGames
      .filter(game => game.toLowerCase().includes(searchTerm.toLowerCase()))
      .slice(0, 8);
    
    this.showGameSuggestions = this.gameSuggestions.length > 0;
  }

  selectGameSuggestion(game: string) {
    this.filters.game = game;
    this.showGameSuggestions = false;
    this.gameSuggestions = [];
  }

  hideGameSuggestions() {
    // Délai pour permettre le clic sur une suggestion
    setTimeout(() => {
      this.showGameSuggestions = false;
    }, 200);
  }

  discoverStreamWithFilters() {
    if (this.isLoading) return;
    
    this.isLoading = true;
    this.error = null;
    
    const cleanFilters: StreamFilters = {};
    if (this.filters.game) cleanFilters.game = this.filters.game;
    if (this.filters.language) cleanFilters.language = this.filters.language;
    
    // Gestion spéciale pour "Moins de 10 viewers"
    if (this.filters.minViewers !== undefined) {
      const minViewers = Number(this.filters.minViewers);
      if (minViewers === 0) {
        // Pour "Moins de 10 viewers", on cherche entre 1 et 9
        cleanFilters.minViewers = 1;
        cleanFilters.maxViewers = 9;
      } else {
        cleanFilters.minViewers = minViewers;
      }
    }

    this.subscriptions.add(
      this.streamService.discoverStream(cleanFilters).subscribe({
        next: (response) => {
          this.isLoading = false;
          if (response.success && response.data) {
            this.currentStream = response.data;
            
            // 📝 Marquer automatiquement le stream comme vu
            this.streamService.markStreamAsViewed(this.currentStream);
            
            this.checkIfFavorite();
          } else {
            this.error = response.error || 'Aucun stream trouvé avec ces critères';
          }
        },
        error: (err) => {
          this.isLoading = false;
          this.error = 'Erreur lors de la recherche de streams';
          console.error('Erreur discovery:', err);
        }
      })
    );
  }

  clearFilters() {
    this.filters = {
      game: '',
      language: '',
      minViewers: undefined
    };
    // Lancer une recherche sans filtres
    this.discoverStream();
  }

  // � Toggle du panneau d'historique
  toggleHistoryPanel() {
    this.showHistoryPanel = !this.showHistoryPanel;
  }

  // 📋 Obtenir l'historique pour l'affichage
  getViewHistory() {
    return this.streamService.getViewHistory();
  }

  // 🎯 Naviguer vers un stream de l'historique
  goToHistoryStream(streamerName: string) {
    // Trouver le stream dans l'historique pour récupérer ses infos
    const historyStream = this.getViewHistory().find(s => s.streamerName === streamerName);
    
    if (historyStream) {
      // Reconstituer l'objet Stream complet pour le viewer
      this.currentStream = {
        streamerId: historyStream.streamerId,
        streamerName: historyStream.streamerName,
        titre: `Stream de ${historyStream.streamerName}`, // Titre par défaut
        jeu: historyStream.gameName,
        categorie: historyStream.gameName,
        langue: 'fr', // Langue par défaut 
        nbViewers: historyStream.viewerCount,
        thumbnailUrl: historyStream.thumbnailUrl,
        embedUrl: `https://player.twitch.tv/?channel=${historyStream.streamerName}`
      };
      
      // Fermer le panel d'historique
      this.showHistoryPanel = false;
      
      // Ouvrir le viewer en mode plein écran
      this.isWatchingStream = true;
      
      console.log(`🎬 Ouverture du stream ${historyStream.streamerName} depuis l'historique`);
    }
  }

  // �🗑️ Réinitialiser l'historique des streams vus
  resetViewHistory() {
    this.streamService.clearViewHistory();
    this.showHistoryPanel = false; // Fermer le panel après reset
    console.log('🗑️ Historique réinitialisé');
  }

  // � Calculer le temps écoulé depuis la visualisation
  getTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffMinutes < 1) return 'À l\'instant';
    if (diffMinutes < 60) return `${diffMinutes}min`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}j`;
  }

  // �📊 Obtenir les statistiques d'historique
  getHistoryStats() {
    return this.streamService.getHistoryStats();
  }

  // 📈 Formater le nombre de viewers
  formatViewerCount(count: number): string {
    return this.streamService.formatViewerCount(count);
  }
}
