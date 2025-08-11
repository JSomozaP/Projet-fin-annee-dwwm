import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';

export interface UserProgression {
  id: string;
  userId: string;
  level: number;
  totalXP: number;
  currentXP: number;
  nextLevelXP: number;
  badges: string[];
  titles: string[];
  currentTitle?: string;
  streamsDiscovered: number;
  favoritesAdded: number;
  subscriptionTier: 'free' | 'premium' | 'vip';
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  type: 'daily' | 'weekly' | 'monthly' | 'achievement';
  category: string;
  xpReward: number;
  badgeReward?: string;
  requirement: number;
  progress: number;
  isCompleted: boolean;
  completedAt?: Date;
}

export interface LevelInfo {
  level: number;
  requiredXP: number;
  rewards: {
    title?: string;
    badge?: string;
    features?: string[];
  };
}

@Injectable({
  providedIn: 'root'
})
export class UserProgressionService {
  private baseUrl = environment.apiUrl;
  
  // BehaviorSubject pour suivre les changements de progression
  private progressionSubject = new BehaviorSubject<UserProgression | null>(null);
  public progression$ = this.progressionSubject.asObservable();

  // Système de niveaux
  private levelSystem: LevelInfo[] = [
    { level: 1, requiredXP: 0, rewards: {} },
    { level: 2, requiredXP: 1000, rewards: {} },
    { level: 3, requiredXP: 2500, rewards: {} },
    { level: 4, requiredXP: 4500, rewards: {} },
    { level: 5, requiredXP: 7000, rewards: { title: 'Explorateur', badge: 'explorer' } },
    { level: 6, requiredXP: 10000, rewards: {} },
    { level: 7, requiredXP: 13500, rewards: {} },
    { level: 8, requiredXP: 17500, rewards: {} },
    { level: 9, requiredXP: 22000, rewards: {} },
    { level: 10, requiredXP: 27000, rewards: { title: 'Scout Expert', badge: 'expert_scout', features: ['Speed Dating Premium'] } },
    { level: 15, requiredXP: 45000, rewards: { title: 'Découvreur Confirmé', badge: 'confirmed_discoverer' } },
    { level: 20, requiredXP: 70000, rewards: { title: 'Parrain', badge: 'sponsor', features: ['Boost Gratuit +1'] } },
    { level: 25, requiredXP: 100000, rewards: { title: 'Mentor Communautaire', badge: 'community_mentor' } },
    { level: 30, requiredXP: 140000, rewards: { title: 'Ambassadeur', badge: 'ambassador', features: ['Raids Premium'] } },
    { level: 40, requiredXP: 200000, rewards: { title: 'Maître Découvreur', badge: 'discovery_master' } },
    { level: 50, requiredXP: 300000, rewards: { title: 'Légende', badge: 'legend', features: ['Toutes fonctionnalités Premium'] } }
  ];

  constructor(private http: HttpClient) {}

  // Obtenir la progression de l'utilisateur connecté
  getUserProgression(): Observable<UserProgression> {
    return this.http.get<UserProgression>(`${this.baseUrl}/api/quests/progression`);
  }

  // Obtenir les quêtes de l'utilisateur
  getUserQuests(type?: string): Observable<Quest[]> {
    let url = `${this.baseUrl}/api/quests/user`;
    if (type) {
      url += `?type=${type}`;
    }
    return this.http.get<Quest[]>(url);
  }

  // Tracker une action pour les quêtes
  trackAction(action: string, data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/quests/track`, { action, data });
  }

  // Changer le titre actuel
  changeTitle(title: string): Observable<any> {
    return this.http.patch(`${this.baseUrl}/api/quests/progression/title`, { title });
  }

  // Calculer les informations de niveau
  calculateLevelInfo(totalXP: number): { level: number; currentXP: number; nextLevelXP: number } {
    let currentLevel = 1;
    let currentLevelXP = 0;
    
    // Trouver le niveau actuel
    for (let i = this.levelSystem.length - 1; i >= 0; i--) {
      if (totalXP >= this.levelSystem[i].requiredXP) {
        currentLevel = this.levelSystem[i].level;
        currentLevelXP = this.levelSystem[i].requiredXP;
        break;
      }
    }
    
    // Trouver le XP nécessaire pour le prochain niveau
    let nextLevelXP = this.getNextLevelXP(currentLevel);
    
    return {
      level: currentLevel,
      currentXP: totalXP - currentLevelXP,
      nextLevelXP: nextLevelXP - currentLevelXP
    };
  }

  // Obtenir les récompenses d'un niveau
  getLevelRewards(level: number): LevelInfo['rewards'] {
    const levelInfo = this.levelSystem.find(l => l.level === level);
    return levelInfo?.rewards || {};
  }

  // Obtenir le XP nécessaire pour le prochain niveau
  private getNextLevelXP(currentLevel: number): number {
    const nextLevelInfo = this.levelSystem.find(l => l.level === currentLevel + 1);
    if (nextLevelInfo) {
      return nextLevelInfo.requiredXP;
    }
    
    // Formule pour les niveaux très élevés non définis
    const baseXP = 300000; // XP du niveau 50
    const increment = 50000; // Augmentation par niveau
    return baseXP + ((currentLevel - 50) * increment);
  }

  // Vérifier si un niveau débloque des fonctionnalités
  hasLevelUnlockedFeatures(level: number): boolean {
    const rewards = this.getLevelRewards(level);
    return !!(rewards.features && rewards.features.length > 0);
  }

  // Obtenir toutes les fonctionnalités débloquées jusqu'à un niveau
  getUnlockedFeatures(level: number): string[] {
    const features: string[] = [];
    
    this.levelSystem.forEach(levelInfo => {
      if (levelInfo.level <= level && levelInfo.rewards.features) {
        features.push(...levelInfo.rewards.features);
      }
    });
    
    return features;
  }

  // Mettre à jour la progression locale
  updateProgression(progression: UserProgression) {
    this.progressionSubject.next(progression);
  }

  // Obtenir la progression actuelle
  getCurrentProgression(): UserProgression | null {
    return this.progressionSubject.value;
  }

  // Calculer le pourcentage de progression vers le prochain niveau
  getXPPercentage(currentXP: number, nextLevelXP: number): number {
    if (nextLevelXP === 0) return 100;
    return Math.min((currentXP / nextLevelXP) * 100, 100);
  }

  // Formater l'affichage de l'XP
  formatXP(xp: number): string {
    if (xp >= 1000000) {
      return `${(xp / 1000000).toFixed(1)}M`;
    } else if (xp >= 1000) {
      return `${(xp / 1000).toFixed(1)}K`;
    }
    return xp.toString();
  }

  // Obtenir le rang estimé (simulation)
  async getUserRank(): Promise<{ rank: number; total: number; percentile: number }> {
    // TODO: Remplacer par un appel API réel
    return {
      rank: Math.floor(Math.random() * 1000) + 1,
      total: 5000,
      percentile: Math.random() * 100
    };
  }
}
