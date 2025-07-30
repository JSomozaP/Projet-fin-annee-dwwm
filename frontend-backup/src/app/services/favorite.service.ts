import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export interface Favorite {
  id: string;
  userId: string;
  streamerId: string;
  streamerName: string;
  streamerAvatar?: string;
  dateAjout: string;
  notificationActive: boolean;
}

export interface FavoriteStats {
  totalFavorites: number;
  uniqueStreamers: number;
  lastAdded: string;
  firstAdded: string;
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

@Injectable({
  providedIn: 'root'
})
export class FavoriteService {
  private apiUrl = environment.apiUrl;
  private favoritesSubject = new BehaviorSubject<Favorite[]>([]);
  private statsSubject = new BehaviorSubject<FavoriteStats | null>(null);

  // Observables publics
  public favorites$ = this.favoritesSubject.asObservable();
  public stats$ = this.statsSubject.asObservable();

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {
    // Charger les favoris quand l'utilisateur se connecte
    this.authService.isAuthenticated$.subscribe(isAuth => {
      if (isAuth) {
        this.loadFavorites();
        this.loadStats();
      } else {
        this.favoritesSubject.next([]);
        this.statsSubject.next(null);
      }
    });
  }

  // Ajouter un streamer aux favoris
  addFavorite(streamerId: string, streamerName: string, gameId?: string, gameName?: string): Observable<ApiResponse<Favorite>> {
    const body = {
      streamerId,
      streamerName,
      gameId,
      gameName
    };

    return this.http.post<ApiResponse<Favorite>>(`${this.apiUrl}/favorites`, body, {
      headers: this.authService.getAuthHeaders()
    }).pipe(
      tap(response => {
        if (response.success) {
          // Rafraîchir la liste des favoris
          this.loadFavorites();
          this.loadStats();
        }
      })
    );
  }

  // Supprimer un streamer des favoris
  removeFavorite(streamerId: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/favorites/${streamerId}`, {
      headers: this.authService.getAuthHeaders()
    }).pipe(
      tap(response => {
        if (response.success) {
          // Rafraîchir la liste des favoris
          this.loadFavorites();
          this.loadStats();
        }
      })
    );
  }

  // Obtenir tous les favoris
  getFavorites(page: number = 1, limit: number = 20): Observable<ApiResponse<Favorite[]>> {
    return this.http.get<ApiResponse<Favorite[]>>(`${this.apiUrl}/favorites?page=${page}&limit=${limit}`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  // Charger les favoris et mettre à jour le BehaviorSubject
  loadFavorites(): void {
    this.getFavorites().subscribe({
      next: (response) => {
        if (response.success) {
          this.favoritesSubject.next(response.data);
        }
      },
      error: (error) => {
        console.error('Erreur lors du chargement des favoris:', error);
        this.favoritesSubject.next([]);
      }
    });
  }

  // Vérifier si un streamer est en favori
  checkFavorite(streamerId: string): Observable<ApiResponse<{ isFavorite: boolean; favorite: Favorite | null }>> {
    return this.http.get<ApiResponse<{ isFavorite: boolean; favorite: Favorite | null }>>(
      `${this.apiUrl}/favorites/check/${streamerId}`,
      { headers: this.authService.getAuthHeaders() }
    );
  }

  // Obtenir les favoris actuellement en live
  getLiveFavorites(): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/favorites/live`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  // Obtenir les statistiques des favoris
  getStats(): Observable<ApiResponse<FavoriteStats>> {
    return this.http.get<ApiResponse<FavoriteStats>>(`${this.apiUrl}/favorites/stats`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  // Charger les stats et mettre à jour le BehaviorSubject
  loadStats(): void {
    this.getStats().subscribe({
      next: (response) => {
        if (response.success) {
          this.statsSubject.next(response.data);
        }
      },
      error: (error) => {
        console.error('Erreur lors du chargement des stats:', error);
        this.statsSubject.next(null);
      }
    });
  }

  // Vérifier si un streamer est favori (méthode synchrone)
  isFavorite(streamerId: string): boolean {
    const favorites = this.favoritesSubject.value;
    return favorites.some(fav => fav.streamerId === streamerId);
  }

  // Obtenir le nombre de favoris actuel
  getFavoriteCount(): number {
    return this.favoritesSubject.value.length;
  }
}
