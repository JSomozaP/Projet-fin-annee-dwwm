import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
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

// Interfaces pour les notifications
export interface QuestNotification {
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

  // Système de niveaux étendu - 200 niveaux
  private levelSystem: LevelInfo[] = [
    // Niveaux 1-10 : Débuts
    { level: 1, requiredXP: 0, rewards: { title: 'Nouveau Spectateur', badge: '👶' } },
    { level: 2, requiredXP: 100, rewards: { title: 'Curieux', badge: '🧐' } },
    { level: 3, requiredXP: 250, rewards: { title: 'Observateur', badge: '👀' } },
    { level: 4, requiredXP: 450, rewards: { title: 'Spectateur Actif', badge: '⚡' } },
    { level: 5, requiredXP: 700, rewards: { title: 'Découvreur', badge: '🔍', features: ['Quêtes spéciales découverte'] } },
    { level: 6, requiredXP: 1000, rewards: { title: 'Explorateur Junior', badge: '🗺️' } },
    { level: 7, requiredXP: 1350, rewards: { title: 'Chasseur de Talents', badge: '🎯' } },
    { level: 8, requiredXP: 1750, rewards: { title: 'Amateur Éclairé', badge: '💡' } },
    { level: 9, requiredXP: 2200, rewards: { title: 'Spectateur Averti', badge: '🎓' } },
    { level: 10, requiredXP: 2700, rewards: { title: 'Découvreur Passionné', badge: '🔥', features: ['Badge spécial niveau 10'] } },
    
    // Niveaux 11-25 : Développement
    { level: 11, requiredXP: 3250, rewards: { title: 'Explorateur Confirmé', badge: '🧭' } },
    { level: 12, requiredXP: 3850, rewards: { title: 'Connaisseur', badge: '🍷' } },
    { level: 13, requiredXP: 4500, rewards: { title: 'Navigateur Expert', badge: '⛵' } },
    { level: 14, requiredXP: 5200, rewards: { title: 'Chercheur de Pépites', badge: '💎' } },
    { level: 15, requiredXP: 5950, rewards: { title: 'Gardien des Micro-Streamers', badge: '🛡️', features: ['Bonus XP micro-streamers +25%'] } },
    { level: 16, requiredXP: 6750, rewards: { title: 'Ambassadeur', badge: '🎭' } },
    { level: 17, requiredXP: 7600, rewards: { title: 'Éclaireur Vétéran', badge: '🏴‍☠️' } },
    { level: 18, requiredXP: 8500, rewards: { title: 'Maître Découvreur', badge: '👑' } },
    { level: 19, requiredXP: 9450, rewards: { title: 'Sage du Streaming', badge: '🧙‍♂️' } },
    { level: 20, requiredXP: 10450, rewards: { title: 'Légende Naissante', badge: '⭐', features: ['Quêtes épiques débloquées'] } },
    { level: 21, requiredXP: 11500, rewards: { title: 'Champion des Petits', badge: '🏆' } },
    { level: 22, requiredXP: 12600, rewards: { title: 'Architecte de Communauté', badge: '🏗️' } },
    { level: 23, requiredXP: 13750, rewards: { title: 'Virtuose de l\'Exploration', badge: '🎨' } },
    { level: 24, requiredXP: 14950, rewards: { title: 'Gardien de la Diversité', badge: '🌈' } },
    { level: 25, requiredXP: 16200, rewards: { title: 'MAÎTRE DE LA DÉCOUVERTE', badge: '👑', features: ['Titre MAÎTRE', 'Bonus XP découverte +50%'] } },
    
    // Niveaux 26-50 : Excellence
    { level: 26, requiredXP: 17500, rewards: { title: 'Pionnier Légendaire', badge: '🚀' } },
    { level: 27, requiredXP: 18850, rewards: { title: 'Oracle du Streaming', badge: '🔮' } },
    { level: 28, requiredXP: 20250, rewards: { title: 'Protecteur Suprême', badge: '🛡️' } },
    { level: 29, requiredXP: 21700, rewards: { title: 'Empereur de l\'Exploration', badge: '👑' } },
    { level: 30, requiredXP: 23200, rewards: { title: 'COMMANDEUR ÉTERNEL', badge: '⚔️', features: ['Rang COMMANDEUR', 'Bonus XP global +25%'] } },
    { level: 31, requiredXP: 24750, rewards: { title: 'Titan de la Diversité', badge: '🌟' } },
    { level: 32, requiredXP: 26350, rewards: { title: 'Archiviste Ultime', badge: '📚' } },
    { level: 33, requiredXP: 28000, rewards: { title: 'Phénix Éternel', badge: '🔥' } },
    { level: 34, requiredXP: 29700, rewards: { title: 'Architecte des Rêves', badge: '🏰' } },
    { level: 35, requiredXP: 31450, rewards: { title: 'SEIGNEUR DE STREAMYSCOVERY', badge: '👑', features: ['Titre SEIGNEUR', 'Accès aux quêtes mythiques'] } },
    { level: 36, requiredXP: 33250, rewards: { title: 'Héros des Temps Modernes', badge: '🦸' } },
    { level: 37, requiredXP: 35100, rewards: { title: 'Gardien Millénaire', badge: '🕰️' } },
    { level: 38, requiredXP: 37000, rewards: { title: 'Conquérant d\'Univers', badge: '🌌' } },
    { level: 39, requiredXP: 38950, rewards: { title: 'Empereur Galactique', badge: '🚀' } },
    { level: 40, requiredXP: 40950, rewards: { title: 'DIVINITÉ MINEURE', badge: '✨', features: ['Statut DIVINITÉ', 'Pouvoirs spéciaux'] } },
    { level: 41, requiredXP: 43000, rewards: { title: 'Avatar de la Découverte', badge: '🌟' } },
    { level: 42, requiredXP: 45100, rewards: { title: 'Maître du Multivers', badge: '🌀' } },
    { level: 43, requiredXP: 47250, rewards: { title: 'Créateur de Légendes', badge: '📜' } },
    { level: 44, requiredXP: 49450, rewards: { title: 'Gardien de l\'Éternité', badge: '♾️' } },
    { level: 45, requiredXP: 51700, rewards: { title: 'ARCHANGE DE LA COMMUNAUTÉ', badge: '👼', features: ['Rang ARCHANGE'] } },
    { level: 46, requiredXP: 54000, rewards: { title: 'Tisserand du Destin', badge: '🕸️' } },
    { level: 47, requiredXP: 56350, rewards: { title: 'Maître des Éléments', badge: '🌊' } },
    { level: 48, requiredXP: 58750, rewards: { title: 'Prophète Suprême', badge: '🔮' } },
    { level: 49, requiredXP: 61200, rewards: { title: 'Empereur des Dimensions', badge: '🌌' } },
    { level: 50, requiredXP: 63700, rewards: { title: 'DIEU MINEUR DE STREAMYSCOVERY', badge: '⚡', features: ['Statut DIEU MINEUR', 'Pouvoirs divins'] } },
    
    // Niveaux 51-100 : Phase Légendaire
    { level: 55, requiredXP: 76950, rewards: { title: 'ARCHIMAGE SUPRÊME', badge: '🧙‍♂️', features: ['Titre ARCHIMAGE'] } },
    { level: 60, requiredXP: 91450, rewards: { title: 'DIEU MAJEUR DE LA DÉCOUVERTE', badge: '👑', features: ['Statut DIEU MAJEUR'] } },
    { level: 65, requiredXP: 107200, rewards: { title: 'CRÉATEUR PRIMORDIAL SUPRÊME', badge: '🌅', features: ['Rang CRÉATEUR PRIMORDIAL'] } },
    { level: 70, requiredXP: 124200, rewards: { title: 'DIEU SUPRÊME DE STREAMYSCOVERY', badge: '👑', features: ['Statut DIEU SUPRÊME', 'Contrôle total'] } },
    { level: 75, requiredXP: 142450, rewards: { title: 'IMMORTEL VÉNÉRABLE', badge: '🏛️', features: ['Statut IMMORTEL'] } },
    { level: 80, requiredXP: 161950, rewards: { title: 'DÉITÉ ABSOLUE', badge: '🌟', features: ['Rang DÉITÉ ABSOLUE'] } },
    { level: 85, requiredXP: 182700, rewards: { title: 'MAÎTRE SUPRÊME DE L\'INFINI', badge: '♾️', features: ['Titre MAÎTRE SUPRÊME'] } },
    { level: 90, requiredXP: 204700, rewards: { title: 'EMPEREUR DE L\'ÉTERNITÉ', badge: '⚔️', features: ['Rang EMPEREUR ÉTERNEL'] } },
    { level: 95, requiredXP: 227950, rewards: { title: 'DIEU-EMPEREUR SUPRÊME', badge: '⚡', features: ['Titre DIEU-EMPEREUR'] } },
    { level: 100, requiredXP: 252450, rewards: { title: 'MAÎTRE ABSOLU DE L\'UNIVERS STREAMING', badge: '🌌', features: ['Titre MAÎTRE ABSOLU', 'Contrôle universel'] } },
    
    // Niveaux 101-200 : Au-delà de la Transcendance
    { level: 105, requiredXP: 292000, rewards: { title: 'ENTITÉ PRIMORDIALE', badge: '🌅', features: ['Statut ENTITÉ PRIMORDIALE'] } },
    { level: 110, requiredXP: 350000, rewards: { title: 'ARCHÉTYPE PARFAIT', badge: '⚡', features: ['Statut ARCHÉTYPE'] } },
    { level: 120, requiredXP: 500000, rewards: { title: 'EMPEREUR CONCEPTUEL', badge: '💭' } },
    { level: 130, requiredXP: 720000, rewards: { title: 'ESSENCE PURE ABSOLUE', badge: '💎' } },
    { level: 140, requiredXP: 1000000, rewards: { title: 'TRANSCENDANT ULTIME', badge: '✨' } },
    { level: 150, requiredXP: 1500000, rewards: { title: 'DIEU ABSOLU ÉTERNEL', badge: '👑', features: ['Statut DIEU ABSOLU'] } },
    { level: 160, requiredXP: 2000000, rewards: { title: 'MAÎTRE DE L\'INCONCEVABLE', badge: '❓' } },
    { level: 170, requiredXP: 2500000, rewards: { title: 'ESSENCE MÉTA-DIVINE', badge: '⚡' } },
    { level: 180, requiredXP: 3200000, rewards: { title: 'CRÉATEUR DE CRÉATEURS', badge: '🌟' } },
    { level: 190, requiredXP: 4000000, rewards: { title: 'PERFECTION POST-ABSOLUE', badge: '💫' } },
    { level: 200, requiredXP: 5000000, rewards: { title: 'MAÎTRE SUPRÊME DE STREAMYSCOVERY', badge: '👑', features: ['STATUT ULTIME : MAÎTRE SUPRÊME', 'POUVOIR OMNIPOTENT', 'LÉGENDE ÉTERNELLE ABSOLUE'] } }
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
        isMicroStreamer: viewerCount < 10,  // Cohérence avec stream_discovered
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
    const token = localStorage.getItem('token');
    const headers: any = {};
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      console.log('🔑 Token ajouté aux headers pour getUserProgression');
    } else {
      console.log('⚠️ Aucun token trouvé pour getUserProgression');
    }
    
    return this.http.get<any>(`${this.baseUrl}/quests/progression`, { headers })
      .pipe(
        map(response => {
          console.log('📊 Réponse brute getUserProgression:', response);
          // Le backend renvoie { success: true, data: progression }
          return response.data || response;
        })
      );
  }

  // Obtenir les quêtes de l'utilisateur
  getUserQuests(type?: string): Observable<Quest[]> {
    let url = `${this.baseUrl}/quests/user`;
    if (type) {
      url += `?type=${type}`;
    }
    return this.http.get<Quest[]>(url);
  }

  // Tracker une action pour les quêtes
  trackAction(action: string, data: any): Observable<any> {
    const token = localStorage.getItem('token');
    const requestOptions: any = {};
    
    // Extraire l'userId du token JWT
    let userId = null;
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        userId = payload.userId;
      } catch (error) {
        console.warn('⚠️ Impossible de décoder le token JWT:', error);
      }
      
      requestOptions.headers = {
        'Authorization': `Bearer ${token}`
      };
    }
    
    // Inclure l'userId dans le body de la requête
    const requestBody = { action, data, userId };
    
    return this.http.post(`${this.baseUrl}/quests/track-action`, requestBody, requestOptions);
  }

  // Changer le titre actuel
  changeTitle(title: string): Observable<any> {
    return this.http.patch(`${this.baseUrl}/quests/progression/title`, { title });
  }

  // **NOUVELLE FONCTION: Récupérer les données de progression des quêtes conditionnelles**
  getQuestProgressData(): Observable<any> {
    const token = localStorage.getItem('token');
    const requestOptions: any = {};
    
    if (token) {
      requestOptions.headers = {
        'Authorization': `Bearer ${token}`
      };
    }
    
    return this.http.get(`${this.baseUrl}/quests/progress-data`, requestOptions);
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

  // Obtenir le XP nécessaire pour le prochain niveau (étendu jusqu'à 200)
  private getNextLevelXP(currentLevel: number): number {
    const nextLevelInfo = this.levelSystem.find(l => l.level === currentLevel + 1);
    if (nextLevelInfo) {
      return nextLevelInfo.requiredXP;
    }
    
    // Formule pour les niveaux ultra élevés (201+) non définis explicitement
    if (currentLevel >= 200) {
      const baseXP = 5000000; // XP du niveau 200
      const increment = 100000; // Augmentation massive pour niveaux post-200
      return baseXP + ((currentLevel - 200) * increment);
    }
    
    // Formule progressive pour niveaux intermédiaires manquants
    const lastDefinedLevel = this.levelSystem[this.levelSystem.length - 1];
    const increment = Math.max(50000, lastDefinedLevel.requiredXP * 0.15); // 15% d'augmentation minimum
    return lastDefinedLevel.requiredXP + ((currentLevel - lastDefinedLevel.level) * increment);
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

  // Méthode pour accéder aux données de session
  getSessionData() {
    return this.sessionData;
  }
}
