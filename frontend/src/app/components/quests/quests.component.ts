import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { UserProgressionService } from '../../services/user-progression.service';

interface Quest {
  id: string;
  title: string;
  description: string;
  type: 'daily' | 'weekly' | 'monthly';
  icon: string;
  progress: number;
  target: number;
  reward: string;
  completed: boolean;
  category: 'discovery' | 'social' | 'time' | 'variety' | 'achievement' | 'interaction';
}

interface QuestPool {
  daily: Quest[];
  weekly: Quest[];
  monthly: Quest[];
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  completed: boolean;
  progress?: number;
  target?: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

@Component({
  selector: 'app-quests',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './quests.component.html',
  styleUrl: './quests.component.scss'
})
export class QuestsComponent implements OnInit, OnDestroy {
  isOpen = false;
  quests: Quest[] = [];
  achievements: Achievement[] = [];
  questPool: QuestPool = { daily: [], weekly: [], monthly: [] };
  
  private readonly STORAGE_KEY = 'streamyscovery_quests';
  private readonly QUEST_RESET_HOUR = 6; // Reset à 6h du matin
  private subscriptions = new Subscription();

  constructor(private userProgressionService: UserProgressionService) {}

  ngOnInit() {
    this.initializeQuestPool();
    this.loadOrGenerateQuests();
    this.loadAchievements();
    this.subscribeToProgressionUpdates();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  /**
   * S'abonner aux mises à jour de progression du service
   */
  private subscribeToProgressionUpdates() {
    // S'abonner aux statistiques locales pour mettre à jour les quêtes
    this.subscriptions.add(
      this.userProgressionService.getLocalStats().subscribe(stats => {
        this.updateQuestsFromStats(stats);
      })
    );
  }

  /**
   * Mettre à jour les quêtes basées sur les statistiques
   */
  private updateQuestsFromStats(stats: any) {
    // Mettre à jour les quêtes basées sur les statistiques locales
    this.quests.forEach(quest => {
      switch (quest.id) {
        // Quêtes de découverte
        case 'daily_discover_3':
        case 'daily_discover_5':
        case 'daily_productive_day':
        case 'weekly_discover_20':
        case 'weekly_discover_35':
        case 'monthly_discoverer_100':
          quest.progress = stats.streamsDiscovered || 0;
          break;
          
        // Quêtes de favoris
        case 'daily_favorite_1':
        case 'daily_favorite_3':
        case 'weekly_favorites_10':
        case 'monthly_supporter_50':
          quest.progress = stats.favoritesAdded || 0;
          break;
          
        // Quêtes de temps de visionnage (en minutes)
        case 'daily_watch_30':
          quest.progress = Math.floor((stats.totalWatchTime || 0) / 60);
          break;
        case 'daily_watch_60':
          quest.progress = Math.floor((stats.totalWatchTime || 0) / 60);
          break;
        case 'monthly_marathon_20h':
          quest.progress = Math.floor((stats.totalWatchTime || 0) / 3600);
          break;
          
        // Quêtes de sessions
        case 'daily_multiple_sessions':
        case 'daily_loyal_viewer':
        case 'weekly_session_master':
        case 'monthly_session_champion':
          quest.progress = stats.sessionsCompleted || 0;
          break;
          
        // Quêtes de catégories
        case 'daily_variety_3':
        case 'weekly_variety_gaming':
        case 'monthly_variety_master':
          quest.progress = stats.gameCategories || 0;
          break;
      }
      
      // Vérifier si la quête est complétée
      if (quest.progress >= quest.target && !quest.completed) {
        quest.completed = true;
        console.log(`✅ Quête complétée: ${quest.title}`);
        
        // Créer une description claire de ce qui a été accompli
        const accomplishmentMessage = this.generateAccomplishmentMessage(quest);
        
        // Émettre une notification via le service
        this.userProgressionService['emitQuestNotification']({
          id: quest.id,
          questTitle: `🎯 Quête accomplie !`,
          questDescription: accomplishmentMessage,
          reward: quest.reward,
          type: 'quest_completed' as any,
          timestamp: new Date()
        });
      }
    });
    
    // Sauvegarder les modifications
    this.saveQuestsToStorage();
  }

  openQuests() {
    this.isOpen = true;
  }

  closeQuests() {
    this.isOpen = false;
  }

  /**
   * Charger les quêtes depuis le localStorage ou en générer de nouvelles
   */
  private loadOrGenerateQuests() {
    try {
      const storedData = localStorage.getItem(this.STORAGE_KEY);
      
      if (storedData) {
        const questData = JSON.parse(storedData);
        
        // Vérifier si on doit reset les quêtes
        if (this.shouldResetQuests(questData.timestamp)) {
          console.log('🔄 Reset des quêtes requis');
          this.generateAndSaveQuests();
        } else {
          console.log('📖 Chargement des quêtes sauvegardées');
          this.quests = questData.quests;
        }
      } else {
        console.log('🆕 Génération de nouvelles quêtes');
        this.generateAndSaveQuests();
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement des quêtes:', error);
      this.generateAndSaveQuests();
    }
  }

  /**
   * Générer de nouvelles quêtes et les sauvegarder
   */
  private generateAndSaveQuests() {
    this.generateRandomQuests();
    this.saveQuestsToStorage();
  }

  /**
   * Sauvegarder les quêtes dans le localStorage
   */
  private saveQuestsToStorage() {
    const questData = {
      quests: this.quests,
      timestamp: new Date().toISOString(),
      resetTime: this.getNextResetTime()
    };
    
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(questData));
    console.log('💾 Quêtes sauvegardées dans localStorage');
  }

  /**
   * Vérifier si on doit reset les quêtes
   */
  private shouldResetQuests(timestamp: string): boolean {
    if (!timestamp) return true;
    
    const lastReset = new Date(timestamp);
    const now = new Date();
    const lastResetTime = this.getLastResetTime(lastReset);
    
    return now > lastResetTime;
  }

  /**
   * Obtenir le dernier moment de reset basé sur une date
   */
  private getLastResetTime(date: Date): Date {
    const resetTime = new Date(date);
    resetTime.setHours(this.QUEST_RESET_HOUR, 0, 0, 0);
    
    // Si on est après l'heure de reset aujourd'hui, c'est pour demain
    if (date.getHours() >= this.QUEST_RESET_HOUR) {
      resetTime.setDate(resetTime.getDate() + 1);
    }
    
    return resetTime;
  }

  /**
   * Obtenir le prochain moment de reset
   */
  private getNextResetTime(): Date {
    const nextReset = new Date();
    nextReset.setHours(this.QUEST_RESET_HOUR, 0, 0, 0);
    
    // Si on est après l'heure de reset aujourd'hui, c'est pour demain
    if (new Date().getHours() >= this.QUEST_RESET_HOUR) {
      nextReset.setDate(nextReset.getDate() + 1);
    }
    
    return nextReset;
  }

  /**
   * Mettre à jour la progression d'une quête et sauvegarder
   */
  updateQuestProgress(questId: string, progress: number) {
    const quest = this.quests.find(q => q.id === questId);
    if (quest && !quest.completed) {
      quest.progress = Math.min(progress, quest.target);
      quest.completed = quest.progress >= quest.target;
      
      this.saveQuestsToStorage();
      console.log(`📈 Quête ${questId} mise à jour: ${quest.progress}/${quest.target}`);
    }
  }

  private initializeQuestPool() {
    // Pool de quêtes quotidiennes (30 quêtes différentes)
    this.questPool.daily = [
      // Découverte
      { id: 'daily_discover_3', title: 'Explorateur du jour', description: 'Découvrez 3 nouveaux streamers', type: 'daily', icon: '🎯', progress: 0, target: 3, reward: '+100 XP', completed: false, category: 'discovery' },
      { id: 'daily_discover_5', title: 'Grand découvreur', description: 'Découvrez 5 nouveaux streamers', type: 'daily', icon: '🔍', progress: 0, target: 5, reward: '+150 XP', completed: false, category: 'discovery' },
      { id: 'daily_small_streamer', title: 'Ami des petits', description: 'Découvrez 2 streamers avec moins de 50 viewers', type: 'daily', icon: '🌱', progress: 0, target: 2, reward: '+120 XP', completed: false, category: 'discovery' },
      { id: 'daily_micro_streamers', title: 'Héros des micro-streamers', description: 'Découvrez 2 streamers avec moins de 10 viewers', type: 'daily', icon: '🦸', progress: 0, target: 2, reward: '+200 XP', completed: false, category: 'discovery' },
      { id: 'daily_random_discovery', title: 'Aventurier spontané', description: 'Utilisez la découverte aléatoire 5 fois', type: 'daily', icon: '🎲', progress: 0, target: 5, reward: '+90 XP', completed: false, category: 'discovery' },
      
      // Social
      { id: 'daily_favorite_1', title: 'Coup de cœur', description: 'Ajoutez 1 streamer à vos favoris', type: 'daily', icon: '❤️', progress: 0, target: 1, reward: '+50 XP', completed: false, category: 'social' },
      { id: 'daily_favorite_3', title: 'Collectionneur quotidien', description: 'Ajoutez 3 streamers à vos favoris', type: 'daily', icon: '💝', progress: 0, target: 3, reward: '+120 XP', completed: false, category: 'social' },
      { id: 'daily_loyal_viewer', title: 'Spectateur fidèle', description: 'Regardez 2 streams pendant au moins 10 minutes chacun', type: 'daily', icon: '📌', progress: 0, target: 2, reward: '+80 XP', completed: false, category: 'social' },
      { id: 'daily_small_supporter', title: 'Supporter des petits', description: 'Ajoutez 3 streamers avec <50 viewers à vos favoris', type: 'daily', icon: '🌱', progress: 0, target: 3, reward: '+90 XP', completed: false, category: 'social' },
      
      // Temps
      { id: 'daily_watch_30', title: 'Spectateur attentif', description: 'Regardez 30 min de streams', type: 'daily', icon: '⏰', progress: 0, target: 30, reward: '+75 XP', completed: false, category: 'time' },
      { id: 'daily_watch_60', title: 'Marathon quotidien', description: 'Regardez 1h de streams', type: 'daily', icon: '⌚', progress: 0, target: 60, reward: '+100 XP', completed: false, category: 'time' },
      { id: 'daily_multiple_sessions', title: 'Sessions multiples', description: 'Regardez 3 streams différents de 10min chacun', type: 'daily', icon: '🔄', progress: 0, target: 3, reward: '+90 XP', completed: false, category: 'time' },
      
      // Variété
      { id: 'daily_variety_3', title: 'Éclectique', description: 'Découvrez 3 catégories de jeux différentes', type: 'daily', icon: '🎮', progress: 0, target: 3, reward: '+110 XP', completed: false, category: 'variety' },
      { id: 'daily_language_mix', title: 'Polyglotte', description: 'Regardez des streams en 2 langues différentes', type: 'daily', icon: '🌍', progress: 0, target: 2, reward: '+85 XP', completed: false, category: 'variety' },
      { id: 'daily_viewer_range', title: 'Diversité d\'audience', description: 'Regardez 1 petit stream (<100) et 1 gros stream (>1000)', type: 'daily', icon: '⚖️', progress: 0, target: 2, reward: '+95 XP', completed: false, category: 'variety' },
      { id: 'daily_diverse_games', title: 'Touche-à-tout', description: 'Découvrez des streams de 3 jeux différents', type: 'daily', icon: '🕹️', progress: 0, target: 3, reward: '+100 XP', completed: false, category: 'variety' },
      
      // Interaction
      { id: 'daily_session_time', title: 'Spectateur dévoué', description: 'Regardez un stream pendant au moins 15 minutes', type: 'daily', icon: '💬', progress: 0, target: 1, reward: '+60 XP', completed: false, category: 'interaction' },
      
      // Achievement
      { id: 'daily_first_time', title: 'Première fois', description: 'Découvrez un jeu que vous n\'avez jamais vu', type: 'daily', icon: '🆕', progress: 0, target: 1, reward: '+80 XP', completed: false, category: 'achievement' },
      { id: 'daily_micro_discovery', title: 'Dénicheur de micro-streamers', description: 'Trouvez un streamer avec moins de 10 viewers', type: 'daily', icon: '💎', progress: 0, target: 1, reward: '+150 XP', completed: false, category: 'achievement' },
      { id: 'daily_comeback', title: 'Retour aux sources', description: 'Revisitez un ancien favori', type: 'daily', icon: '🔙', progress: 0, target: 1, reward: '+40 XP', completed: false, category: 'achievement' },
      { id: 'daily_morning_explorer', title: 'Explorateur matinal', description: 'Découvrez un stream entre 6h et 12h', type: 'daily', icon: '🌅', progress: 0, target: 1, reward: '+60 XP', completed: false, category: 'achievement' },
      { id: 'daily_evening_explorer', title: 'Explorateur vespéral', description: 'Découvrez un stream entre 18h et 23h', type: 'daily', icon: '🌙', progress: 0, target: 1, reward: '+60 XP', completed: false, category: 'achievement' },
      { id: 'daily_productive_day', title: 'Journée productive', description: 'Découvrez 5 nouveaux streamers en une seule journée', type: 'daily', icon: '⚡', progress: 0, target: 5, reward: '+120 XP', completed: false, category: 'achievement' },
      
      // Méta-quêtes
      { id: 'daily_quest_streak', title: 'Série quotidienne', description: 'Complétez vos quêtes quotidiennes 3 jours d\'affilée', type: 'daily', icon: '🔥', progress: 0, target: 3, reward: '+150 XP', completed: false, category: 'achievement' },
      { id: 'daily_completionist', title: 'Perfectionniste', description: 'Complétez toutes vos quêtes quotidiennes aujourd\'hui', type: 'daily', icon: '✨', progress: 0, target: 1, reward: '+200 XP', completed: false, category: 'achievement' },
      
      // Nouvelles quêtes facilement réalisables
      { id: 'daily_quick_explorer', title: 'Explorateur express', description: 'Découvrez 2 streamers en moins de 5 minutes', type: 'daily', icon: '⚡', progress: 0, target: 2, reward: '+70 XP', completed: false, category: 'discovery' },
      { id: 'daily_category_hopper', title: 'Sauteur de catégories', description: 'Regardez 2 catégories de jeux différentes', type: 'daily', icon: '🦘', progress: 0, target: 2, reward: '+65 XP', completed: false, category: 'variety' },
      { id: 'daily_micro_hunter', title: 'Chasseur de micro-streamers', description: 'Trouvez 1 streamer avec moins de 5 viewers', type: 'daily', icon: '🔍', progress: 0, target: 1, reward: '+180 XP', completed: false, category: 'discovery' },
      { id: 'daily_favorite_revisit', title: 'Retrouvailles', description: 'Revisitez 1 de vos anciens favoris', type: 'daily', icon: '🔄', progress: 0, target: 1, reward: '+50 XP', completed: false, category: 'social' },
      { id: 'daily_session_starter', title: 'Bon démarrage', description: 'Regardez un stream pendant au moins 5 minutes', type: 'daily', icon: '▶️', progress: 0, target: 1, reward: '+40 XP', completed: false, category: 'time' }
    ];

    // Pool de quêtes hebdomadaires (19 quêtes)
    this.questPool.weekly = [
      // Découverte
      { id: 'weekly_discover_20', title: 'Explorateur confirmé', description: 'Découvrez 20 streamers différents', type: 'weekly', icon: '🌟', progress: 0, target: 20, reward: '+500 XP', completed: false, category: 'discovery' },
      { id: 'weekly_discover_35', title: 'Maître explorateur', description: 'Découvrez 35 streamers différents', type: 'weekly', icon: '🔭', progress: 0, target: 35, reward: '+750 XP', completed: false, category: 'discovery' },
      { id: 'weekly_small_only', title: 'Champion des petits', description: 'Découvrez exclusivement des streamers <100 viewers (15 minimum)', type: 'weekly', icon: '🏆', progress: 0, target: 15, reward: '+600 XP', completed: false, category: 'discovery' },
      
      // Social
      { id: 'weekly_favorites_10', title: 'Collectionneur passionné', description: 'Ajoutez 10 nouveaux favoris', type: 'weekly', icon: '⭐', progress: 0, target: 10, reward: '+400 XP', completed: false, category: 'social' },
      { id: 'weekly_micro_supporter', title: 'Protecteur des micro-streamers', description: 'Ajoutez 5 streamers avec <20 viewers à vos favoris', type: 'weekly', icon: '🏗️', progress: 0, target: 5, reward: '+550 XP', completed: false, category: 'social' },
      { id: 'weekly_session_master', title: 'Maître des sessions', description: 'Regardez 7 streams pendant au moins 20 minutes chacun', type: 'weekly', icon: '📋', progress: 0, target: 7, reward: '+350 XP', completed: false, category: 'social' },
      
      // Temps
      { id: 'weekly_marathon_4h', title: 'Marathon du week-end', description: 'Regardez 4h de streams ce week-end', type: 'weekly', icon: '🏃', progress: 0, target: 240, reward: '+350 XP', completed: false, category: 'time' },
      { id: 'weekly_daily_consistency', title: 'Régularité hebdomadaire', description: 'Découvrez au moins 1 stream chaque jour de la semaine', type: 'weekly', icon: '📅', progress: 0, target: 7, reward: '+450 XP', completed: false, category: 'time' },
      
      // Variété
      { id: 'weekly_variety_gaming', title: 'Diversité gaming', description: 'Regardez 8 catégories de jeux différentes', type: 'weekly', icon: '🎮', progress: 0, target: 8, reward: '+400 XP', completed: false, category: 'variety' },
      { id: 'weekly_global_explorer', title: 'Explorateur mondial', description: 'Découvrez des streamers de 5 pays différents', type: 'weekly', icon: '🌎', progress: 0, target: 5, reward: '+500 XP', completed: false, category: 'variety' },
      { id: 'weekly_size_diversity', title: 'Diversité d\'audiences', description: 'Regardez des streams de toutes tailles (micro/petit/moyen/grand)', type: 'weekly', icon: '📊', progress: 0, target: 4, reward: '+300 XP', completed: false, category: 'variety' },
      
      // Achievement
      { id: 'weekly_trendsetter', title: 'Lanceur de tendances', description: 'Découvrez 3 jeux récemment sortis (moins de 6 mois)', type: 'weekly', icon: '🚀', progress: 0, target: 3, reward: '+400 XP', completed: false, category: 'achievement' },
      { id: 'weekly_retro_gamer', title: 'Nostalgique', description: 'Regardez 5 streams de jeux sortis avant 2010', type: 'weekly', icon: '👾', progress: 0, target: 5, reward: '+350 XP', completed: false, category: 'achievement' },
      { id: 'weekly_genre_master', title: 'Maître de genre', description: 'Devenez expert d\'un genre en regardant 10 streams du même type', type: 'weekly', icon: '🎯', progress: 0, target: 10, reward: '+450 XP', completed: false, category: 'achievement' },
      { id: 'weekly_consistent_explorer', title: 'Explorateur régulier', description: 'Découvrez au moins 3 streamers chaque jour pendant 5 jours', type: 'weekly', icon: '⚡', progress: 0, target: 5, reward: '+500 XP', completed: false, category: 'achievement' },
      { id: 'weekly_weekend_warrior', title: 'Guerrier du week-end', description: 'Découvrez 15 streams pendant le week-end', type: 'weekly', icon: '🏖️', progress: 0, target: 15, reward: '+400 XP', completed: false, category: 'achievement' },
      
      // Nouvelles quêtes hebdomadaires facilement réalisables
      { id: 'weekly_favorite_cleaner', title: 'Organisateur de favoris', description: 'Revisitez 5 de vos anciens favoris', type: 'weekly', icon: '🧹', progress: 0, target: 5, reward: '+250 XP', completed: false, category: 'social' },
      { id: 'weekly_quick_sessions', title: 'Sessions rapides', description: 'Regardez 10 streams pendant au moins 3 minutes chacun', type: 'weekly', icon: '⏱️', progress: 0, target: 10, reward: '+300 XP', completed: false, category: 'time' },
      { id: 'weekly_category_explorer', title: 'Explorateur de catégories', description: 'Regardez 5 catégories de jeux différentes', type: 'weekly', icon: '🗺️', progress: 0, target: 5, reward: '+280 XP', completed: false, category: 'variety' }
    ];

    // Pool de quêtes mensuelles (14 quêtes)
    this.questPool.monthly = [
      { id: 'monthly_veteran_20', title: 'Vétéran assidu', description: 'Connectez-vous 20 jours ce mois-ci', type: 'monthly', icon: '🗓️', progress: 0, target: 20, reward: '+1000 XP', completed: false, category: 'achievement' },
      { id: 'monthly_supporter_50', title: 'Supporter du mois', description: 'Ajoutez 50 streamers à vos favoris', type: 'monthly', icon: '🎖️', progress: 0, target: 50, reward: '+800 XP', completed: false, category: 'social' },
      { id: 'monthly_discoverer_100', title: 'Grand découvreur', description: 'Découvrez 100 streamers uniques', type: 'monthly', icon: '🏔️', progress: 0, target: 100, reward: '+1200 XP', completed: false, category: 'discovery' },
      { id: 'monthly_variety_master', title: 'Maître de la variété', description: 'Explorez 20 catégories de jeux différentes', type: 'monthly', icon: '🌈', progress: 0, target: 20, reward: '+900 XP', completed: false, category: 'variety' },
      { id: 'monthly_micro_champion', title: 'Champion des micro-streamers', description: 'Ajoutez 25 streamers avec <20 viewers à vos favoris', type: 'monthly', icon: '🦸', progress: 0, target: 25, reward: '+1100 XP', completed: false, category: 'social' },
      { id: 'monthly_marathon_20h', title: 'Marathonien légendaire', description: 'Regardez 20h de contenu ce mois', type: 'monthly', icon: '⏰', progress: 0, target: 1200, reward: '+1000 XP', completed: false, category: 'time' },
      { id: 'monthly_global_citizen', title: 'Citoyen du monde', description: 'Découvrez des streamers de 10 pays différents', type: 'monthly', icon: '🌍', progress: 0, target: 10, reward: '+950 XP', completed: false, category: 'variety' },
      { id: 'monthly_session_champion', title: 'Champion des longues sessions', description: 'Regardez 20 streams pendant au moins 30 minutes chacun', type: 'monthly', icon: '👑', progress: 0, target: 20, reward: '+1500 XP', completed: false, category: 'achievement' },
      
      // Nouvelles quêtes de progression ajoutées
      { id: 'monthly_disciple_level10', title: 'Disciple dévoué', description: 'Atteignez le niveau 10', type: 'monthly', icon: '🥉', progress: 0, target: 10, reward: '+2000 XP', completed: false, category: 'achievement' },
      { id: 'monthly_master_level25', title: 'Maître persévérant', description: 'Atteignez le niveau 25', type: 'monthly', icon: '🥈', progress: 0, target: 25, reward: '+5000 XP', completed: false, category: 'achievement' },
      { id: 'monthly_legend_level50', title: 'Légende éternelle', description: 'Atteignez le niveau 50', type: 'monthly', icon: '🥇', progress: 0, target: 50, reward: '+10000 XP', completed: false, category: 'achievement' },
      { id: 'monthly_quest_completionist', title: 'Perfectionniste suprême', description: 'Complétez 50 quêtes ce mois-ci', type: 'monthly', icon: '✨', progress: 0, target: 50, reward: '+2500 XP', completed: false, category: 'achievement' },
      
      // Nouvelles quêtes mensuelles facilement réalisables
      { id: 'monthly_daily_visitor', title: 'Visiteur quotidien', description: 'Connectez-vous 15 jours ce mois-ci', type: 'monthly', icon: '📅', progress: 0, target: 15, reward: '+700 XP', completed: false, category: 'achievement' },
      { id: 'monthly_variety_explorer', title: 'Explorateur de variété', description: 'Regardez 15 catégories de jeux différentes ce mois', type: 'monthly', icon: '🎨', progress: 0, target: 15, reward: '+650 XP', completed: false, category: 'variety' }
    ];
  }

  private generateRandomQuests() {
    // Générer des quêtes aléatoires pour chaque utilisateur
    // Quotidiennes: 4 quêtes parmi 30 possibles
    const dailyQuests = this.getRandomQuests(this.questPool.daily, 4);
    
    // Hebdomadaires: 3 quêtes parmi 19 possibles  
    const weeklyQuests = this.getRandomQuests(this.questPool.weekly, 3);
    
    // Mensuelles: 2 quêtes parmi 14 possibles
    const monthlyQuests = this.getRandomQuests(this.questPool.monthly, 2);
    
    // Combiner toutes les quêtes
    this.quests = [...dailyQuests, ...weeklyQuests, ...monthlyQuests];
  }

  private getRandomQuests(pool: Quest[], count: number): Quest[] {
    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count).map(quest => ({ ...quest }));
  }

  private generateRealisticProgress(quest: Quest): number {
    // Génère une progression réaliste selon le type de quête
    const progressRatio = Math.random();
    
    if (quest.type === 'daily') {
      // Progression de 0% à 80% pour les quêtes quotidiennes
      return Math.floor(quest.target * progressRatio * 0.8);
    } else if (quest.type === 'weekly') {
      // Progression de 0% à 60% pour les quêtes hebdomadaires
      return Math.floor(quest.target * progressRatio * 0.6);
    } else {
      // Progression de 0% à 40% pour les quêtes mensuelles
      return Math.floor(quest.target * progressRatio * 0.4);
    }
  }

  private loadAchievements() {
    // Succès permanents massifs pour une progression addictive (35+ achievements)
    this.achievements = [
      // Achievements communs (premiers pas)
      { id: 'first_discovery', title: 'Premier Pas', description: 'Découvrez votre premier streamer', icon: '🥇', completed: true, rarity: 'common' },
      { id: 'early_supporter', title: 'Supporter précoce', description: 'Ajoutez votre premier favori', icon: '❤️', completed: true, rarity: 'common' },
      { id: 'session_explorer', title: 'Explorateur de Sessions', description: 'Regardez 5 sessions de plus de 10 minutes', icon: '🦋', completed: true, progress: 5, target: 5, rarity: 'common' },
      { id: 'first_week', title: 'Première Semaine', description: 'Utilisez Streamyscovery pendant 7 jours', icon: '📅', completed: false, progress: 3, target: 7, rarity: 'common' },
      { id: 'social_butterfly', title: 'Papillon Social', description: 'Ajoutez 10 favoris', icon: '🦋', completed: false, progress: 4, target: 10, rarity: 'common' },
      { id: 'curious_mind', title: 'Esprit Curieux', description: 'Découvrez 25 streamers', icon: '🧠', completed: false, progress: 18, target: 25, rarity: 'common' },
      
      // Achievements rares (engagement moyen)
      { id: 'small_streamer_friend', title: 'Ami des Petits', description: 'Découvrez 50 streamers avec moins de 100 viewers', icon: '🌱', completed: false, progress: 23, target: 50, rarity: 'rare' },
      { id: 'variety_seeker', title: 'Chercheur de Variété', description: 'Explorez 25 catégories de jeux différentes', icon: '🎯', completed: false, progress: 12, target: 25, rarity: 'rare' },
      { id: 'night_explorer', title: 'Explorateur Nocturne', description: 'Découvrez 20 streams après minuit', icon: '🌙', completed: false, progress: 7, target: 20, rarity: 'rare' },
      { id: 'morning_bird', title: 'Lève-tôt', description: 'Découvrez 15 streams avant 9h', icon: '🌅', completed: false, progress: 2, target: 15, rarity: 'rare' },
      { id: 'weekend_warrior', title: 'Guerrier du Week-end', description: 'Découvrez 100 streams les week-ends', icon: '⚔️', completed: false, progress: 34, target: 100, rarity: 'rare' },
      { id: 'streak_master', title: 'Maître des Séries', description: 'Complétez des quêtes 10 jours d\'affilée', icon: '🔥', completed: false, progress: 3, target: 10, rarity: 'rare' },
      { id: 'category_hunter', title: 'Chasseur de Catégories', description: 'Explorez 50 catégories différentes', icon: '🏹', completed: false, progress: 19, target: 50, rarity: 'rare' },
      { id: 'speed_discoverer', title: 'Découvreur Express', description: 'Découvrez 10 streamers en moins d\'une heure', icon: '⚡', completed: false, progress: 0, target: 1, rarity: 'rare' },
      
      // Achievements épiques (engagement élevé)
      { id: 'micro_supporter', title: 'Supporter des Micro-streamers', description: 'Ajoutez 100 streamers avec moins de 50 viewers à vos favoris', icon: '🏗️', completed: false, progress: 45, target: 100, rarity: 'epic' },
      { id: 'globe_trotter', title: 'Globe-trotter', description: 'Découvrez des streamers de 15 pays différents', icon: '🌍', completed: false, progress: 8, target: 15, rarity: 'epic' },
      { id: 'marathon_master', title: 'Maître du Marathon', description: 'Regardez 100h de contenu au total', icon: '⏰', completed: false, progress: 67, target: 100, rarity: 'epic' },
      { id: 'micro_hunter', title: 'Chasseur de Micro-streamers', description: 'Trouvez 50 streamers avec moins de 10 viewers', icon: '🔍', completed: false, progress: 12, target: 50, rarity: 'epic' },
      { id: 'community_builder', title: 'Bâtisseur de Communauté', description: 'Aidez 500 micro-streamers en les ajoutant aux favoris', icon: '🏗️', completed: false, progress: 178, target: 500, rarity: 'epic' },
      { id: 'genre_master', title: 'Maître des Genres', description: 'Devenez expert de 10 genres différents', icon: '🎓', completed: false, progress: 4, target: 10, rarity: 'epic' },
      { id: 'time_traveler', title: 'Voyageur Temporel', description: 'Regardez des streams à toutes les heures de la journée', icon: '⏳', completed: false, progress: 16, target: 24, rarity: 'epic' },
      { id: 'language_polyglot', title: 'Polyglotte', description: 'Découvrez des streams en 10 langues différentes', icon: '🗣️', completed: false, progress: 3, target: 10, rarity: 'epic' },
      { id: 'trend_spotter', title: 'Détecteur de Tendances', description: 'Découvrez 25 jeux avant qu\'ils deviennent populaires', icon: '📈', completed: false, progress: 7, target: 25, rarity: 'epic' },
      
      // Achievements légendaires (engagement extrême)
      { id: 'discovery_legend', title: 'Légende de la Découverte', description: 'Découvrez 1000 streamers uniques', icon: '👑', completed: false, progress: 342, target: 1000, rarity: 'legendary' },
      { id: 'favorites_collector', title: 'Collectionneur de Favoris', description: 'Ajoutez 500 streamers à vos favoris', icon: '⭐', completed: false, progress: 158, target: 500, rarity: 'legendary' },
      { id: 'platform_veteran', title: 'Vétéran de la Plateforme', description: 'Utilisez Streamyscovery pendant 365 jours', icon: '🏆', completed: false, progress: 127, target: 365, rarity: 'legendary' },
      { id: 'quest_completionist', title: 'Perfectionniste Ultime', description: 'Complétez 1000 quêtes au total', icon: '✨', completed: false, progress: 89, target: 1000, rarity: 'legendary' },
      { id: 'micro_savior', title: 'Sauveur des Micro-streamers', description: 'Découvrez 200 streamers avec moins de 5 viewers', icon: '👼', completed: false, progress: 23, target: 200, rarity: 'legendary' },
      { id: 'streaming_oracle', title: 'Oracle du Streaming', description: 'Prédisez 100 futurs hits en les découvrant tôt', icon: '🔮', completed: false, progress: 12, target: 100, rarity: 'legendary' },
      { id: 'ultimate_explorer', title: 'Explorateur Ultime', description: 'Explorez 100 catégories de jeux différentes', icon: '🚀', completed: false, progress: 34, target: 100, rarity: 'legendary' },
      { id: 'time_lord', title: 'Seigneur du Temps', description: 'Accumulez 1000h de visionnage', icon: '⏰', completed: false, progress: 234, target: 1000, rarity: 'legendary' },
      { id: 'global_ambassador', title: 'Ambassadeur Mondial', description: 'Découvrez des streamers de 50 pays', icon: '🌐', completed: false, progress: 18, target: 50, rarity: 'legendary' },
      
      // Achievements mythiques (les plus rares)
      { id: 'streamyscovery_god', title: 'Dieu de Streamyscovery', description: 'Atteignez le niveau 100', icon: '👁️', completed: false, progress: 6, target: 100, rarity: 'legendary' },
      { id: 'universe_explorer', title: 'Explorateur de l\'Univers', description: 'Découvrez 5000 streamers uniques', icon: '🌌', completed: false, progress: 456, target: 5000, rarity: 'legendary' },
      { id: 'eternal_supporter', title: 'Supporter Éternel', description: 'Maintenez 1000 favoris actifs', icon: '♾️', completed: false, progress: 178, target: 1000, rarity: 'legendary' },
      { id: 'streaming_historian', title: 'Historien du Streaming', description: 'Documentez 2 ans d\'activité continue', icon: '📚', completed: false, progress: 127, target: 730, rarity: 'legendary' },
      { id: 'community_legend', title: 'Légende Communautaire', description: 'Aidez 1000 micro-streamers à grandir', icon: '🌟', completed: false, progress: 267, target: 1000, rarity: 'legendary' }
    ];
  }

  getProgressPercentage(progress: number, target: number): number {
    return Math.min((progress / target) * 100, 100);
  }

  getQuestsByType(type: 'daily' | 'weekly' | 'monthly'): Quest[] {
    return this.quests.filter(quest => quest.type === type);
  }

  /**
   * Générer un message clair de ce qui a été accompli
   */
  private generateAccomplishmentMessage(quest: Quest): string {
    const target = quest.target;
    const questType = quest.type;
    
    // Messages spécifiques selon les catégories de quêtes
    switch (quest.category) {
      case 'discovery':
        if (quest.id.includes('micro')) {
          return `Vous avez découvert ${target} micro-streamer${target > 1 ? 's' : ''} (<10 viewers) !`;
        } else if (quest.id.includes('small')) {
          return `Vous avez découvert ${target} petit${target > 1 ? 's' : ''} streamer${target > 1 ? 's' : ''} (<50 viewers) !`;
        } else {
          return `Vous avez découvert ${target} nouveau${target > 1 ? 'x' : ''} streamer${target > 1 ? 's' : ''} !`;
        }
        
      case 'social':
        if (quest.id.includes('favorite')) {
          return `Vous avez ajouté ${target} streamer${target > 1 ? 's' : ''} à vos favoris !`;
        } else if (quest.id.includes('loyal') || quest.id.includes('session')) {
          return `Vous avez regardé ${target} session${target > 1 ? 's' : ''} de 10+ minutes !`;
        } else {
          return `Action sociale accomplie : ${target} interaction${target > 1 ? 's' : ''} !`;
        }
        
      case 'time':
        if (quest.id.includes('watch_30')) {
          return `Vous avez regardé 30 minutes de streams !`;
        } else if (quest.id.includes('watch_60')) {
          return `Vous avez regardé 1 heure de streams !`;
        } else if (quest.id.includes('multiple_sessions')) {
          return `Vous avez regardé ${target} streams différents de 10+ minutes !`;
        } else if (quest.id.includes('marathon')) {
          return `Marathon accompli : ${target} heures de visionnage !`;
        } else {
          return `Temps de visionnage accompli : ${target} minute${target > 1 ? 's' : ''} !`;
        }
        
      case 'variety':
        if (quest.id.includes('variety') || quest.id.includes('category')) {
          return `Vous avez exploré ${target} catégorie${target > 1 ? 's' : ''} de jeux différente${target > 1 ? 's' : ''} !`;
        } else if (quest.id.includes('language')) {
          return `Vous avez regardé des streams en ${target} langue${target > 1 ? 's' : ''} différente${target > 1 ? 's' : ''} !`;
        } else {
          return `Diversité accomplie : ${target} élément${target > 1 ? 's' : ''} varié${target > 1 ? 's' : ''} !`;
        }
        
      case 'achievement':
        if (quest.id.includes('level')) {
          return `Niveau ${target} atteint ! Félicitations !`;
        } else if (quest.id.includes('quest')) {
          return `${target} quête${target > 1 ? 's' : ''} accomplie${target > 1 ? 's' : ''} ce ${questType === 'daily' ? 'jour' : questType === 'weekly' ? 'semaine' : 'mois'} !`;
        } else if (quest.id.includes('streak')) {
          return `Série de ${target} jour${target > 1 ? 's' : ''} consécutif${target > 1 ? 's' : ''} !`;
        } else {
          return `Achievement débloqué : ${quest.title} !`;
        }
        
      default:
        return `${quest.title} - ${target} objectif${target > 1 ? 's' : ''} atteint${target > 1 ? 's' : ''} !`;
    }
  }
}
