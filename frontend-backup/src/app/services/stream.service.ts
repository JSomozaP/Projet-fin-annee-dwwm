import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export interface Stream {
  id: string;
  streamerId: string;
  streamerName: string;
  titre: string;
  jeu: string;
  categorie: string;
  nbViewers: number;
  langue: string;
  pays: string;
  thumbnailUrl: string;
  embedUrl: string;
  dateMiseAJour: string;
  isLive: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
  };
}

export interface StreamFilters {
  language?: string;
  minViewers?: number;
  maxViewers?: number;
  gameId?: string;
  excludeIds?: string[];
  limit?: number;
}

export interface DiscoverFilters extends StreamFilters {
  userId?: string;
}

export interface CacheStats {
  totalCached: number;
  currentlyLive: number;
  lastUpdate: string;
}

@Injectable({
  providedIn: 'root'
})
export class StreamService {
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  // Découvrir un stream intelligent (notre feature principale !)
  discoverStream(filters?: DiscoverFilters): Observable<ApiResponse<Stream>> {
    let params = new HttpParams();
    
    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = filters[key as keyof DiscoverFilters];
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(v => params = params.append(key, v.toString()));
          } else {
            params = params.set(key, value.toString());
          }
        }
      });
    }

    return this.http.get<ApiResponse<Stream>>(`${this.apiUrl}/streams/discover`, { 
      params,
      headers: this.authService.getAuthHeaders()
    });
  }

  // Obtenir un stream aléatoire (méthode simple)
  getRandomStream(filters?: StreamFilters): Observable<ApiResponse<Stream>> {
    let params = new HttpParams();
    
    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = filters[key as keyof StreamFilters];
        if (value !== undefined && value !== null) {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http.get<ApiResponse<Stream>>(`${this.apiUrl}/streams/random`, { params });
  }

  // Obtenir tous les streams avec pagination
  getStreams(filters?: StreamFilters): Observable<ApiResponse<Stream[]>> {
    let params = new HttpParams();
    
    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = filters[key as keyof StreamFilters];
        if (value !== undefined && value !== null) {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http.get<ApiResponse<Stream[]>>(`${this.apiUrl}/streams`, { params });
  }

  // Rechercher un jeu
  searchGame(query: string): Observable<ApiResponse<any>> {
    const params = new HttpParams().set('query', query);
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/streams/search-game`, { params });
  }

  // Rafraîchir le cache des streams
  refreshCache(): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/streams/cache/refresh`, {});
  }

  // Obtenir les statistiques du cache
  getCacheStats(): Observable<ApiResponse<CacheStats>> {
    return this.http.get<ApiResponse<CacheStats>>(`${this.apiUrl}/streams/cache/stats`);
  }

  // Obtenir l'URL d'embed pour un stream
  getEmbedUrl(streamerName: string): string {
    return `https://player.twitch.tv/?channel=${streamerName}&parent=${window.location.hostname}`;
  }

  // Obtenir l'URL de la page Twitch du streamer
  getTwitchUrl(streamerName: string): string {
    return `https://twitch.tv/${streamerName}`;
  }

  // Formatage du nombre de viewers
  formatViewerCount(count: number): string {
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1) + 'M';
    } else if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'K';
    }
    return count.toString();
  }

  // Obtenir l'URL de thumbnail optimisée
  getOptimizedThumbnail(thumbnailUrl: string, width: number = 640, height: number = 360): string {
    return thumbnailUrl.replace('{width}x{height}', `${width}x${height}`);
  }
}
