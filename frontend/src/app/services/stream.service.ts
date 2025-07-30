import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
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
    return new HttpHeaders({
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    });
  }

  discoverStream(): Observable<ApiResponse<Stream>> {
    const headers = this.getAuthHeaders();
    return this.http.get<ApiResponse<Stream>>(`${environment.apiUrl}/streams/discover`, { headers });
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
}
