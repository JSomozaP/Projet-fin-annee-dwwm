import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface Favorite {
  id: number;
  streamer_id: string;
  streamer_name: string;
  streamer_avatar?: string;
  game_name?: string;
  created_at: string;
  isLive?: boolean;
  // Nouvelles propriétés enrichies
  displayName?: string;
  description?: string;
  profileImageUrl?: string;
  viewCount?: number;
  followerCount?: number;
  currentGame?: string;
  viewerCount?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class FavoriteService {
  private favoritesSubject = new BehaviorSubject<Favorite[]>([]);
  public favorites$ = this.favoritesSubject.asObservable();
  
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  constructor(
    private http: HttpClient
  ) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    });
  }

  private isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  }

  loadFavorites(): void {
    if (!this.isAuthenticated()) return;
    
    this.loadingSubject.next(true);
    const headers = this.getAuthHeaders();
    
    // Demander les informations enrichies avec vérification du statut live
    this.http.get<ApiResponse<Favorite[]>>(`${environment.apiUrl}/favorites?checkLive=true`, { headers })
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.favoritesSubject.next(response.data);
          }
          this.loadingSubject.next(false);
        },
        error: (error) => {
          console.error('Erreur lors du chargement des favoris:', error);
          this.loadingSubject.next(false);
        }
      });
  }

  getFavorites(): Observable<ApiResponse<Favorite[]>> {
    const headers = this.getAuthHeaders();
    // Demander les informations enrichies avec vérification du statut live
    return this.http.get<ApiResponse<Favorite[]>>(`${environment.apiUrl}/favorites?checkLive=true`, { headers });
  }

  addFavorite(streamerId: string, streamerName: string, gameName: string): Observable<ApiResponse<any>> {
    const headers = this.getAuthHeaders();
    const body = { 
      streamerId: streamerId,        // Changé de streamer_id en streamerId
      streamerName: streamerName,    // Changé de streamer_name en streamerName  
      gameName: gameName,           // Changé de game_name en gameName
      gameId: null                  // Ajouté gameId même si null
    };
    
    console.log('📝 Envoi de la requête d\'ajout aux favoris:', body);
    
    return this.http.post<ApiResponse<any>>(`${environment.apiUrl}/favorites`, body, { headers })
      .pipe(
        tap(response => {
          console.log('✅ Réponse ajout favori:', response);
          if (response.success) {
            this.loadFavorites(); // Recharger la liste
          }
        })
      );
  }

  removeFavorite(streamerId: string): Observable<ApiResponse<any>> {
    const headers = this.getAuthHeaders();
    return this.http.delete<ApiResponse<any>>(`${environment.apiUrl}/favorites/${streamerId}`, { headers })
      .pipe(
        tap(response => {
          if (response.success) {
            this.loadFavorites(); // Recharger la liste
          }
        })
      );
  }

  isFavorite(streamerId: string): boolean {
    const currentFavorites = this.favoritesSubject.value;
    return currentFavorites.some(fav => fav.streamer_id === streamerId);
  }

  getFavoriteCount(): number {
    return this.favoritesSubject.value.length;
  }
}
