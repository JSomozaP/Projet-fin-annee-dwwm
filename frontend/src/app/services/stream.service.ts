/**
 * Streamyscovery - Stream Discovery Service
 * Copyright (c) 2025 Jeremy Somoza. Tous droits réservés.
 * 
 * Service de découverte de streams avec gestion d'historique et filtrage intelligent.
 * Interface principale avec l'API backend pour la découverte de contenu.
 * 
 * @author Jeremy Somoza
 * @project Streamyscovery
 * @date 2025
 */

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
  isLive?: boolean; // Nouvelle propriété pour indiquer si le streamer est en live
  // Propriétés additionnelles pour compatibilité API Twitch
  user_name?: string;
  user_login?: string;
  game_name?: string;
  thumbnail_url?: string;
  viewer_count?: number;
  id?: string;
  title?: string;
  startedAt?: string;
}

export interface StreamFilters {
  game?: string;
  language?: string;
  minViewers?: number;
  maxViewers?: number;
  excludeIds?: string[]; // IDs des streams à exclure
}

export interface CompletedQuest {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  type: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string; // Nouvelle propriété pour les messages informatifs
  questsCompleted?: CompletedQuest[]; // Nouveau: quêtes complétées retournées par le backend
}

export interface ViewedStream {
  streamerId: string;
  streamerName: string;
  gameName: string;
  thumbnailUrl: string;
  viewerCount: number;
  viewedAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class StreamService {
  
  private viewedStreams: Set<string> = new Set(); // IDs pour exclusion rapide
  private viewedHistory: ViewedStream[] = []; // Historique détaillé pour l'UI
  private readonly MAX_HISTORY = 50; // Réduire à 50 pour performance optimale

  constructor(
    private http: HttpClient
  ) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
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

    // 🚀 Ajouter automatiquement les streams déjà vus
    const excludeIds = Array.from(this.viewedStreams);
    if (excludeIds.length > 0) {
      // Transmettre les IDs comme paramètre multiple
      excludeIds.forEach(id => {
        params = params.append('excludeIds', id);
      });
    }
    
    return this.http.get<ApiResponse<Stream>>(`${environment.apiUrl}/streams/discover`, { headers, params });
  }

  // 📝 Marquer un stream comme vu (version enrichie)
  markStreamAsViewed(stream: Stream): void {
    // Vérifier que le stream a les propriétés nécessaires
    if (!stream || !stream.streamerId) {
      console.warn('Stream invalide passé à markStreamAsViewed:', stream);
      return;
    }
    
    // Ajouter l'ID pour exclusion
    this.viewedStreams.add(stream.streamerId);
    
    // Ajouter les détails pour l'historique
    const viewedStream: ViewedStream = {
      streamerId: stream.streamerId,
      streamerName: stream.streamerName || stream.user_name || 'Inconnu',
      gameName: stream.jeu || stream.game_name || 'Jeu inconnu',
      thumbnailUrl: stream.thumbnailUrl || stream.thumbnail_url || '',
      viewerCount: stream.nbViewers || stream.viewer_count || 0,
      viewedAt: new Date()
    };
    
    // Ajouter au début de l'historique (plus récent en premier)
    this.viewedHistory.unshift(viewedStream);
    
    // Nettoyer l'historique si trop long
    if (this.viewedHistory.length > this.MAX_HISTORY) {
      const removed = this.viewedHistory.pop();
      if (removed) {
        this.viewedStreams.delete(removed.streamerId);
      }
    }
    
    console.log(`📝 Stream ${stream.streamerId} ajouté à l'historique (${this.viewedHistory.length} total)`);
  }

  // 🗑️ Réinitialiser l'historique complet
  clearViewHistory(): void {
    this.viewedStreams.clear();
    this.viewedHistory = [];
    console.log('🗑️ Historique des streams vus réinitialisé');
  }

  // 📋 Obtenir l'historique complet pour l'UI
  getViewHistory(): ViewedStream[] {
    return [...this.viewedHistory]; // Copie pour éviter les mutations
  }

  // 📊 Obtenir les statistiques d'historique
  getHistoryStats(): { viewedCount: number; maxHistory: number } {
    return {
      viewedCount: this.viewedHistory.length,
      maxHistory: this.MAX_HISTORY
    };
  }

  getRandomStream(): Observable<ApiResponse<Stream>> {
    const headers = this.getAuthHeaders();
    return this.http.get<ApiResponse<Stream>>(`${environment.apiUrl}/streams/random`, { headers });
  }

  formatViewerCount(count: number | undefined): string {
    if (count === undefined || count === null || isNaN(count)) {
      return '0';
    }
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

  // Rechercher un streamer spécifique par nom
  searchStreamerByName(streamerName: string): Observable<ApiResponse<Stream>> {
    const headers = this.getAuthHeaders();
    
    return this.http.get<ApiResponse<Stream>>(`${environment.apiUrl}/streams/search-streamer/${encodeURIComponent(streamerName)}`, { headers });
  }
}

