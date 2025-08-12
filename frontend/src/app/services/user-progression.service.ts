import { Injectable, OnDestroy } from '@angular/core';
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

export // Interfaces pour les notifications
interface QuestNotification {
  id: string;
  questTitle: string;
  questDescription: string;
  reward: string;
  type: 'quest_completed' | 'achievement_unlocked' | 'level_up';
  timestamp: Date;
}

// Interfaces existantes
interface QuestAction {
  action: 'stream_discovered' | 'favorite_added' | 'viewing_time' | 'session_started' | 'category_discovered' | 'revisit_favorite';
  data: {
    streamerId?: string;
    streamerName?: string;
    viewerCount?: number;
    gameCategory?: string;
    language?: string;
    sessionDuration?: number; // en minutes
    isMicroStreamer?: boolean;
    isSmallStreamer?: boolean;
    isRevisit?: boolean;
  };
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
export class UserProgressionService implements OnDestroy {
  private baseUrl = environment.apiUrl;
  
  // BehaviorSubject pour suivre les changements de progression
  private progressionSubject = new BehaviorSubject<UserProgression | null>(null);
  public progression$ = this.progressionSubject.asObservable();

  // Système de notifications en temps réel
  private notificationSubject = new BehaviorSubject<QuestNotification | null>(null);
  public questNotifications$ = this.notificationSubject.asObservable();

  // BehaviorSubject pour les statistiques locales
  private statsSubject = new BehaviorSubject<any>({});
  public localStats$ = this.statsSubject.asObservable();

  // Cache local pour éviter les appels API répétés
  private sessionData = {
    streamersDiscovered: new Set<string>(),
    favoritesAdded: new Set<string>(),
    categoriesDiscovered: new Set<string>(),
    viewingSessions: [] as Array<{streamerId: string, startTime: Date, duration: number}>,
    dailyActions: {
      discoveries: 0,
      favorites: 0,
      viewingTime: 0,
      sessions: 0
    }
  };

  // Système de niveaux
  private levelSystem: LevelInfo[] = [
    { level: 1, requiredXP: 0, rewards: { title: 'Nouveau Spectateur', badge: 'newcomer' } },
    { level: 2, requiredXP: 500, rewards: { title: 'Curieux', badge: 'curious' } },
    { level: 3, requiredXP: 1200, rewards: { title: 'Visiteur Régulier', badge: 'regular_visitor' } },
    { level: 4, requiredXP: 2000, rewards: { title: 'Découvreur Novice', badge: 'novice_discoverer' } },
    { level: 5, requiredXP: 3000, rewards: { title: 'Explorateur', badge: 'explorer', features: ['Favoris Étendus'] } },
    { level: 6, requiredXP: 4500, rewards: { title: 'Aventurier', badge: 'adventurer' } },
    { level: 7, requiredXP: 6500, rewards: { title: 'Chasseur de Talents', badge: 'talent_hunter' } },
    { level: 8, requiredXP: 9000, rewards: { title: 'Éclaireur', badge: 'scout' } },
    { level: 9, requiredXP: 12000, rewards: { title: 'Navigateur Expert', badge: 'expert_navigator' } },
    { level: 10, requiredXP: 15500, rewards: { title: 'Scout Expert', badge: 'expert_scout', features: ['Speed Dating Premium'] } },
    { level: 11, requiredXP: 19500, rewards: { title: 'Détective de Streams', badge: 'stream_detective' } },
    { level: 12, requiredXP: 24000, rewards: { title: 'Connaisseur', badge: 'connoisseur' } },
    { level: 13, requiredXP: 29000, rewards: { title: 'Fin Limier', badge: 'fine_tracker' } },
    { level: 14, requiredXP: 34500, rewards: { title: 'Maître Explorateur', badge: 'master_explorer' } },
    { level: 15, requiredXP: 40500, rewards: { title: 'Découvreur Confirmé', badge: 'confirmed_discoverer', features: ['Notifications Priority'] } },
    { level: 16, requiredXP: 47000, rewards: { title: 'Vétéran de la Découverte', badge: 'discovery_veteran' } },
    { level: 17, requiredXP: 54000, rewards: { title: 'Champion des Streamers', badge: 'streamer_champion' } },
    { level: 18, requiredXP: 61500, rewards: { title: 'Gardien de la Communauté', badge: 'community_guardian' } },
    { level: 19, requiredXP: 69500, rewards: { title: 'Sage du Streaming', badge: 'streaming_sage' } },
    { level: 20, requiredXP: 78000, rewards: { title: 'Parrain', badge: 'sponsor', features: ['Boost Gratuit +1'] } },
    { level: 21, requiredXP: 87000, rewards: { title: 'Protecteur des Micro-Streamers', badge: 'micro_protector' } },
    { level: 22, requiredXP: 96500, rewards: { title: 'Oracle de Twitch', badge: 'twitch_oracle' } },
    { level: 23, requiredXP: 106500, rewards: { title: 'Maître de la Variété', badge: 'variety_master' } },
    { level: 24, requiredXP: 117000, rewards: { title: 'Seigneur des Discoveries', badge: 'discovery_lord' } },
    { level: 25, requiredXP: 128000, rewards: { title: 'Mentor Communautaire', badge: 'community_mentor', features: ['Recommandations Personnalisées'] } },
    { level: 26, requiredXP: 139500, rewards: { title: 'Archiviste des Streams', badge: 'stream_archivist' } },
    { level: 27, requiredXP: 151500, rewards: { title: 'Gardien du Savoir', badge: 'knowledge_keeper' } },
    { level: 28, requiredXP: 164000, rewards: { title: 'Maître des Quêtes', badge: 'quest_master' } },
    { level: 29, requiredXP: 177000, rewards: { title: 'Empereur du Contenu', badge: 'content_emperor' } },
    { level: 30, requiredXP: 190500, rewards: { title: 'Ambassadeur', badge: 'ambassador', features: ['Raids Premium'] } },
    { level: 31, requiredXP: 204500, rewards: { title: 'Titan de la Plateforme', badge: 'platform_titan' } },
    { level: 32, requiredXP: 219000, rewards: { title: 'Légende Vivante', badge: 'living_legend' } },
    { level: 33, requiredXP: 234000, rewards: { title: 'Maître Suprême', badge: 'supreme_master' } },
    { level: 34, requiredXP: 249500, rewards: { title: 'Gardien Éternel', badge: 'eternal_guardian' } },
    { level: 35, requiredXP: 265500, rewards: { title: 'Commandeur des Streams', badge: 'stream_commander', features: ['Analytics Avancées'] } },
    { level: 36, requiredXP: 282000, rewards: { title: 'Souverain du Divertissement', badge: 'entertainment_sovereign' } },
    { level: 37, requiredXP: 299000, rewards: { title: 'Architecte de Communauté', badge: 'community_architect' } },
    { level: 38, requiredXP: 316500, rewards: { title: 'Prophète du Gaming', badge: 'gaming_prophet' } },
    { level: 39, requiredXP: 334500, rewards: { title: 'Divinité Streaming', badge: 'streaming_deity' } },
    { level: 40, requiredXP: 353000, rewards: { title: 'Maître Découvreur', badge: 'discovery_master', features: ['Outils de Curation'] } },
    { level: 41, requiredXP: 372000, rewards: { title: 'Transcendant', badge: 'transcendent' } },
    { level: 42, requiredXP: 391500, rewards: { title: 'Omniscient', badge: 'omniscient' } },
    { level: 43, requiredXP: 411500, rewards: { title: 'Gardien du Multivers', badge: 'multiverse_guardian' } },
    { level: 44, requiredXP: 432000, rewards: { title: 'Créateur de Tendances', badge: 'trend_creator' } },
    { level: 45, requiredXP: 453000, rewards: { title: 'Maître du Temps', badge: 'time_master', features: ['Historique Illimité'] } },
    { level: 46, requiredXP: 474500, rewards: { title: 'Sage Millénaire', badge: 'millennial_sage' } },
    { level: 47, requiredXP: 496500, rewards: { title: 'Empereur Cosmique', badge: 'cosmic_emperor' } },
    { level: 48, requiredXP: 519000, rewards: { title: 'Architecte du Destin', badge: 'destiny_architect' } },
    { level: 49, requiredXP: 542000, rewards: { title: 'Créateur de Légendes', badge: 'legend_creator' } },
    { level: 50, requiredXP: 565500, rewards: { title: 'Légende Éternelle', badge: 'eternal_legend', features: ['Toutes fonctionnalités Premium'] } },
    { level: 55, requiredXP: 650000, rewards: { title: 'Divinité Suprême', badge: 'supreme_deity', features: ['Statut VIP Permanent'] } },
    { level: 60, requiredXP: 750000, rewards: { title: 'Maître de l\'Univers', badge: 'universe_master', features: ['Accès Alpha Features'] } },
    { level: 75, requiredXP: 1000000, rewards: { title: 'Créateur du Cosmos', badge: 'cosmos_creator', features: ['Influence sur les Features'] } },
    { level: 100, requiredXP: 2000000, rewards: { title: 'Dieu de Twitchscovery', badge: 'twitchscovery_god', features: ['Badge Unique Permanent'] } }
  ];

  // Système de tracking en temps réel pour les sessions de visionnage
  private activeViewingSessions = new Map<string, {
    streamerId: string;
    game: string;
    startTime: Date;
    lastUpdate: Date;
    intervalId?: any;
  }>();

  /**
   * Démarrer une session de visionnage avec tracking en temps réel
   */
  startViewingSession(streamerId: string, game?: string): void {
    // Arrêter toute session précédente
    this.stopAllViewingSessions();
    
    const sessionKey = `${streamerId}_${Date.now()}`;
    const session = {
      streamerId,
      game: game || 'Unknown',
      startTime: new Date(),
      lastUpdate: new Date(),
      intervalId: undefined as any
    };
    
    this.activeViewingSessions.set(sessionKey, session);
    
    // Tracker immédiatement le début de session
    this.trackViewingSession(streamerId, 0);
    
    // Mettre à jour la progression toutes les minutes
    const intervalId = setInterval(() => {
      this.updateViewingProgress(sessionKey);
    }, 60000); // 60 secondes
    
    session.intervalId = intervalId;
    
    console.log(`🎬 Session de visionnage démarrée pour ${streamerId} (${game})`);
  }

  /**
   * Arrêter une session de visionnage spécifique
   */
  stopViewingSession(streamerId: string): void {
    for (const [key, session] of this.activeViewingSessions) {
      if (session.streamerId === streamerId) {
        // Calculer la durée totale
        const totalDuration = Math.floor((new Date().getTime() - session.startTime.getTime()) / 60000);
        
        // Tracker la session complète
        if (totalDuration > 0) {
          this.trackViewingSession(streamerId, totalDuration);
        }
        
        // Nettoyer
        if (session.intervalId) {
          clearInterval(session.intervalId);
        }
        this.activeViewingSessions.delete(key);
        
        console.log(`🛑 Session terminée: ${totalDuration} minutes pour ${streamerId}`);
        break;
      }
    }
  }

  /**
   * Arrêter toutes les sessions actives (utile lors de la déconnexion)
   */
  stopAllViewingSessions(): void {
    for (const [key, session] of this.activeViewingSessions) {
      const totalDuration = Math.floor((new Date().getTime() - session.startTime.getTime()) / 60000);
      
      // Sauvegarder la progression si la session a duré au moins 1 minute
      if (totalDuration > 0) {
        this.trackViewingSession(session.streamerId, totalDuration);
      }
      
      if (session.intervalId) {
        clearInterval(session.intervalId);
      }
    }
    this.activeViewingSessions.clear();
  }

  /**
   * Mettre à jour la progression d'une session en cours
   */
  private updateViewingProgress(sessionKey: string): void {
    const session = this.activeViewingSessions.get(sessionKey);
    if (!session) return;
    
    const currentTime = new Date();
    const elapsedMinutes = Math.floor((currentTime.getTime() - session.startTime.getTime()) / 60000);
    
    // Tracker la progression actuelle (cela peut déclencher des notifications de quêtes)
    if (elapsedMinutes > 0) {
      this.trackViewingSession(session.streamerId, elapsedMinutes);
    }
    
    session.lastUpdate = currentTime;
    
    console.log(`⏱️ Progression: ${elapsedMinutes} minutes sur ${session.game}`);
  }

  /**
   * Obtenir les sessions de visionnage actives (pour debug)
   */
  getActiveViewingSessions(): Map<string, any> {
    return this.activeViewingSessions;
  }

  constructor(private http: HttpClient) {
    this.initializeSession();
  }

  private initializeSession() {
    // Réinitialiser les données de session quotidiennement
    const today = new Date().toDateString();
    const lastSession = localStorage.getItem('lastSessionDate');
    
    if (lastSession !== today) {
      this.resetDailyProgress();
      localStorage.setItem('lastSessionDate', today);
    }
    
    // Charger les données de session depuis localStorage
    this.loadSessionData();
  }

  private loadSessionData() {
    const savedData = localStorage.getItem('sessionData');
    if (savedData) {
      const parsed = JSON.parse(savedData);
      this.sessionData = {
        ...this.sessionData,
        ...parsed,
        streamersDiscovered: new Set(parsed.streamersDiscovered || []),
        favoritesAdded: new Set(parsed.favoritesAdded || []),
        categoriesDiscovered: new Set(parsed.categoriesDiscovered || [])
      };
    }
  }

  private saveSessionData() {
    const dataToSave = {
      ...this.sessionData,
      streamersDiscovered: Array.from(this.sessionData.streamersDiscovered),
      favoritesAdded: Array.from(this.sessionData.favoritesAdded),
      categoriesDiscovered: Array.from(this.sessionData.categoriesDiscovered)
    };
    localStorage.setItem('sessionData', JSON.stringify(dataToSave));
  }

  private resetDailyProgress() {
    this.sessionData = {
      streamersDiscovered: new Set(),
      favoritesAdded: new Set(),
      categoriesDiscovered: new Set(),
      viewingSessions: [],
      dailyActions: {
        discoveries: 0,
        favorites: 0,
        viewingTime: 0,
        sessions: 0
      }
    };
    this.saveSessionData();
  }

  // **Méthodes de tracking des actions utilisateur**
  
  /**
   * Tracker la découverte d'un nouveau streamer
   */
  trackStreamDiscovery(streamerId: string, streamerName: string, viewerCount: number, gameCategory: string, language: string = 'fr'): void {
    console.log('🎯 Tracking stream discovery:', { streamerId, streamerName, viewerCount, gameCategory });
    
    // Vérifier si c'est une nouvelle découverte
    if (!this.sessionData.streamersDiscovered.has(streamerId)) {
      this.sessionData.streamersDiscovered.add(streamerId);
      this.sessionData.dailyActions.discoveries++;
      
      // Tracker la catégorie
      if (gameCategory && !this.sessionData.categoriesDiscovered.has(gameCategory)) {
        this.sessionData.categoriesDiscovered.add(gameCategory);
      }
      
      // Préparer l'action pour le backend
      const action: QuestAction = {
        action: 'stream_discovered',
        data: {
          streamerId,
          streamerName,
          viewerCount,
          gameCategory,
          language,
          isMicroStreamer: viewerCount < 10,
          isSmallStreamer: viewerCount < 50
        }
      };
      
      this.saveSessionData();
      this.emitStatsUpdate(); // Émettre les changements
      this.processQuestAction(action);
    }
  }

  /**
   * Tracker l'ajout d'un favori
   */
  trackFavoriteAdded(streamerId: string, streamerName: string, viewerCount: number, isRevisit: boolean = false): void {
    console.log('❤️ Tracking favorite added:', { streamerId, streamerName, viewerCount, isRevisit });
    
    if (!isRevisit && !this.sessionData.favoritesAdded.has(streamerId)) {
      this.sessionData.favoritesAdded.add(streamerId);
      this.sessionData.dailyActions.favorites++;
    }
    
    const action: QuestAction = {
      action: isRevisit ? 'revisit_favorite' : 'favorite_added',
      data: {
        streamerId,
        streamerName,
        viewerCount,
        isMicroStreamer: viewerCount < 20,
        isSmallStreamer: viewerCount < 50,
        isRevisit
      }
    };
    
    this.saveSessionData();
    this.emitStatsUpdate(); // Émettre les changements
    this.processQuestAction(action);
  }

  /**
   * Tracker le temps de visionnage
   */
  trackViewingSession(streamerId: string, sessionDuration: number): void {
    console.log('⏰ Tracking viewing session:', { streamerId, sessionDuration });
    
    this.sessionData.viewingSessions.push({
      streamerId,
      startTime: new Date(),
      duration: sessionDuration
    });
    
    this.sessionData.dailyActions.viewingTime += sessionDuration;
    this.sessionData.dailyActions.sessions++;
    
    const action: QuestAction = {
      action: 'viewing_time',
      data: {
        streamerId,
        sessionDuration
      }
    };
    
    this.saveSessionData();
    this.emitStatsUpdate(); // Émettre les changements
    this.processQuestAction(action);
  }

  /**
   * Tracker le début d'une session de visionnage
   */
  trackSessionStarted(streamerId: string, gameCategory: string): void {
    console.log('▶️ Tracking session started:', { streamerId, gameCategory });
    
    const action: QuestAction = {
      action: 'session_started',
      data: {
        streamerId,
        gameCategory
      }
    };
    
    this.processQuestAction(action);
  }

  /**
   * Traiter une action de quête (appel API ou simulation locale)
   */
  private processQuestAction(action: QuestAction): void {
    // Appel API vers le backend (ou simulation locale pour le développement)
    this.trackAction(action.action, action.data).subscribe({
      next: (response) => {
        console.log('✅ Quest action processed:', response);
        
        // Vérifier si des quêtes ont été complétées
        this.checkQuestCompletions(action);
      },
      error: (error) => {
        console.warn('⚠️ Quest action failed, using local tracking:', error);
        
        // Fallback sur le tracking local avec vérification des quêtes
        this.checkQuestCompletions(action);
      }
    });
  }

  /**
   * Vérifier si des quêtes ont été complétées et émettre des notifications
   */
  private checkQuestCompletions(action: QuestAction): void {
    // Simulation simple de logique de quêtes (à remplacer par la vraie logique)
    const completedQuests = this.simulateQuestCheck(action);
    
    completedQuests.forEach(quest => {
      this.emitQuestNotification({
        id: quest.id,
        questTitle: quest.title,
        questDescription: quest.description,
        reward: quest.reward,
        type: 'quest_completed',
        timestamp: new Date()
      });
    });
  }

  /**
   * Simulation de vérification de quêtes (à remplacer par la vraie logique)
   */
  private simulateQuestCheck(action: QuestAction): any[] {
    // Pour l'instant, simulation simple : 10% de chance de compléter une quête
    const shouldComplete = Math.random() < 0.1;
    
    if (shouldComplete) {
      // Quête exemple complétée
      return [{
        id: 'demo_quest',
        title: '🎯 Quête accomplie !',
        description: `Action ${action.action} réussie !`,
        reward: '+50 XP'
      }];
    }
    
    return [];
  }

  /**
   * Émettre une notification de quête
   */
  emitQuestNotification(notification: QuestNotification): void {
    console.log('🎉 Quest completed:', notification.questTitle);
    this.notificationSubject.next(notification);
    
    // Laisser le composant gérer le timing d'affichage
  }

  // **Getters pour les statistiques locales**
  
  get sessionStats() {
    return {
      streamersDiscovered: this.sessionData.streamersDiscovered.size,
      favoritesAdded: this.sessionData.favoritesAdded.size,
      categoriesDiscovered: this.sessionData.categoriesDiscovered.size,
      totalViewingTime: this.sessionData.dailyActions.viewingTime,
      sessionsCount: this.sessionData.dailyActions.sessions
    };
  }

  get todayProgress() {
    return this.sessionData.dailyActions;
  }

  /**
   * Obtenir un Observable des statistiques locales
   */
  getLocalStats(): Observable<any> {
    return this.localStats$;
  }

  /**
   * Émettre les statistiques mises à jour
   */
  private emitStatsUpdate() {
    const stats = {
      streamsDiscovered: this.sessionData.streamersDiscovered.size,
      favoritesAdded: this.sessionData.favoritesAdded.size,
      gameCategories: this.sessionData.categoriesDiscovered.size,
      totalWatchTime: this.sessionData.dailyActions.viewingTime * 60, // Convertir en secondes
      sessionsCompleted: this.sessionData.dailyActions.sessions,
      dailyActions: this.sessionData.dailyActions
    };
    
    this.statsSubject.next(stats);
  }

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
    return this.http.post(`${this.baseUrl}/quests/track-action`, { action, data });
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

  /**
   * Méthode publique pour écouter les notifications de quêtes
   */
  subscribeToQuestNotifications(callback: (notification: QuestNotification | null) => void) {
    return this.questNotifications$.subscribe(callback);
  }

  /**
   * Forcer l'émission d'une notification (pour debug/test)
   */
  triggerTestNotification(): void {
    this.emitQuestNotification({
      id: 'test_quest',
      questTitle: '🧪 Test de notification',
      questDescription: 'Ceci est un test du système de notifications',
      reward: '+0 XP',
      type: 'quest_completed',
      timestamp: new Date()
    });
  }

  /**
   * Nettoyer les ressources à la destruction du service
   */
  ngOnDestroy(): void {
    this.stopAllViewingSessions();
  }
}
