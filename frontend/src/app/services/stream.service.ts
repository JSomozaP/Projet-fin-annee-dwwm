import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Stream {
  id: string;
  user_id: string;
  user_login: string;
  user_name: string;
  game_id: string;
  game_name: string;
  type: string;
  title: string;
  viewer_count: number;
  started_at: string;
  language: string;
  thumbnail_url: string;
  tag_ids: string[];
  is_mature: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  count?: number;
}

export interface StreamFilters {
  language?: string;
  minViewers?: number;
  maxViewers?: number;
  game?: string;
  limit?: number;
}

@Injectable({
  providedIn: 'root'
})
export class StreamService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  // Obtenir un stream aléatoire
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

  // Obtenir tous les streams
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
  searchGame(gameName: string): Observable<ApiResponse<any>> {
    const params = new HttpParams().set('name', gameName);
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/streams/search-game`, { params });
  }
}
