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
  streamerName?: string;
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
    minViewers: undefined,
    streamerName: ''
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
    
    // Écouter les événements d'ouverture de stream depuis les favoris
    const openStreamFromFavoriteHandler = (event: any) => {
      this.openStreamFromFavorite(event.detail.streamData);
    };
    window.addEventListener('openStreamFromFavorite', openStreamFromFavoriteHandler);
    
    // Nettoyer l'écouteur dans ngOnDestroy
    this.subscriptions.add({
      unsubscribe: () => {
        window.removeEventListener('openStreamFromFavorite', openStreamFromFavoriteHandler);
      }
    } as any);
    
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
    
    // Utiliser la méthode légère pour vérifier un favori spécifique
    this.favoriteService.checkIfStreamerIsFavorite(this.currentStream.streamerId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.isFavorite = response.data.isFavorite;
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

  // Méthode pour gérer le changement de recherche de streamer
  onStreamerSearchChange() {
    // Si on a un nom de streamer spécifique, on recherche ce streamer
    if (this.filters.streamerName && this.filters.streamerName.trim().length > 0) {
      this.searchSpecificStreamer(this.filters.streamerName.trim());
    } else {
      // Sinon, on retourne à la découverte normale avec les autres filtres
      this.discoverStreamWithFilters();
    }
  }

  // Méthode pour rechercher un streamer spécifique
  searchSpecificStreamer(streamerName: string) {
    this.isLoading = true;
    this.error = null;
    
    console.log(`🔍 Recherche du streamer: ${streamerName}`);
    
    // Utiliser la nouvelle API de recherche spécifique
    this.streamService.searchStreamerByName(streamerName).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success && response.data) {
          // Normaliser les données pour assurer la compatibilité
          this.currentStream = this.normalizeStreamData(response.data);
          this.streamService.markStreamAsViewed(this.currentStream);
          
          if (this.isAuthenticated) {
            this.checkIfFavorite();
          }
          
          // Message informatif selon le statut du streamer
          if (response.data.isLive) {
            console.log(`✅ ${streamerName} trouvé et est en live !`);
          } else {
            console.log(`ℹ️ ${streamerName} trouvé mais n'est pas en live actuellement.`);
          }
        } else {
          this.error = response.message || `Aucun streamer trouvé avec le nom "${streamerName}".`;
        }
      },
      error: (error) => {
        console.error('Erreur lors de la recherche du streamer:', error);
        this.isLoading = false;
        this.error = `Erreur lors de la recherche de "${streamerName}".`;
      }
    });
  }

  // Normaliser les données de stream pour assurer la compatibilité
  private normalizeStreamData(streamData: any): Stream {
    return {
      streamerId: streamData.id || streamData.streamerId,
      streamerName: streamData.user_login || streamData.user_name || streamData.streamerName,
      titre: streamData.title || streamData.titre,
      jeu: streamData.game_name || streamData.jeu,
      categorie: streamData.game_name || streamData.categorie,
      langue: streamData.language || streamData.langue,
      nbViewers: streamData.viewer_count || streamData.nbViewers || 0,
      thumbnailUrl: streamData.thumbnail_url || streamData.thumbnailUrl || streamData.profile_image_url,
      embedUrl: streamData.embedUrl || `https://player.twitch.tv/?channel=${streamData.user_login || streamData.streamerName}&parent=localhost`,
      isLive: streamData.isLive || false,
      // Propriétés optionnelles pour compatibilité
      user_name: streamData.user_login || streamData.user_name || streamData.streamerName,
      user_login: streamData.user_login || streamData.user_name || streamData.streamerName,
      game_name: streamData.game_name || streamData.jeu,
      title: streamData.title || streamData.titre,
      thumbnail_url: streamData.thumbnail_url || streamData.thumbnailUrl,
      viewer_count: streamData.viewer_count || streamData.nbViewers || 0,
      id: streamData.id || streamData.streamerId,
      startedAt: streamData.started_at || streamData.startedAt
    };
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
      minViewers: undefined,
      streamerName: ''
    };
    // Lancer une recherche sans filtres
    this.discoverStream();
  }

  // 🔄 Toggle du panneau d'historique
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

  // Ouvrir un stream depuis les favoris
  openStreamFromFavorite(streamData: Stream) {
    // Définir le stream actuel
    this.currentStream = streamData;
    
    // Ouvrir le viewer en mode plein écran
    this.isWatchingStream = true;
    
    // Marquer le stream comme vu (ajouter à l'historique)
    this.streamService.markStreamAsViewed(streamData);
    
    console.log('Stream ouvert depuis les favoris:', streamData.streamerName);
  }

  // 🗑️ Réinitialiser l'historique des streams vus
  resetViewHistory() {
    this.streamService.clearViewHistory();
    this.showHistoryPanel = false; // Fermer le panel après reset
    console.log('🗑️ Historique réinitialisé');
  }

  // ⏰ Calculer le temps écoulé depuis la visualisation
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

  // 📊 Obtenir les statistiques d'historique
  getHistoryStats() {
    return this.streamService.getHistoryStats();
  }

  // 📈 Formater le nombre de viewers
  formatViewerCount(count: number): string {
    return this.streamService.formatViewerCount(count);
  }
}
