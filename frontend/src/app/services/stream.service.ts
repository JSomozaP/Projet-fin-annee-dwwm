import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Stream {
  streamerId: string;
  streamerName: string;
  titre: string;
  jeu: string;
  categorie: string;
  langue: string;
  pays?: string;
  nbViewers: number;
  thumbnailUrl: string;
  embedUrl: string;
}

export interface StreamFilters {
  game?: string;
  language?: string;
  minViewers?: number;
  maxViewers?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class StreamService {

  constructor(
    private http: HttpClient
  ) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    
    return headers;
  }

  discoverStream(filters?: StreamFilters): Observable<ApiResponse<Stream>> {
    const headers = this.getAuthHeaders();
    let params = new HttpParams();
    
    if (filters) {
      if (filters.game) params = params.set('game', filters.game);
      if (filters.language) params = params.set('language', filters.language);
      if (filters.minViewers !== undefined) params = params.set('minViewers', filters.minViewers.toString());
      if (filters.maxViewers !== undefined) params = params.set('maxViewers', filters.maxViewers.toString());
    }
    
    return this.http.get<ApiResponse<Stream>>(`${environment.apiUrl}/streams/discover`, { headers, params });
  }

  getRandomStream(): Observable<ApiResponse<Stream>> {
    const headers = this.getAuthHeaders();
    return this.http.get<ApiResponse<Stream>>(`${environment.apiUrl}/streams/random`, { headers });
  }

  formatViewerCount(count: number): string {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  }

  getTwitchUrl(streamerName: string): string {
    return `https://www.twitch.tv/${streamerName}`;
  }

  // Rechercher des jeux via l'API Twitch
  searchGames(query: string): Observable<ApiResponse<string[]>> {
    const headers = this.getAuthHeaders();
    const params = new HttpParams().set('query', query);
    
    return this.http.get<ApiResponse<string[]>>(`${environment.apiUrl}/streams/games/search`, { headers, params });
  }
}

