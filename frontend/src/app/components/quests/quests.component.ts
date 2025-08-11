import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

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
export class QuestsComponent implements OnInit {
  isOpen = false;
  quests: Quest[] = [];
  achievements: Achievement[] = [];
  questPool: QuestPool = { daily: [], weekly: [], monthly: [] };

  ngOnInit() {
    this.initializeQuestPool();
    this.generateRandomQuests();
    this.loadAchievements();
  }

  openQuests() {
    this.isOpen = true;
  }

  closeQuests() {
    this.isOpen = false;
  }

  private initializeQuestPool() {
    // Pool de quêtes quotidiennes (25 quêtes différentes)
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
      { id: 'daily_share', title: 'Ambassadeur', description: 'Partagez 2 streams découverts', type: 'daily', icon: '📢', progress: 0, target: 2, reward: '+80 XP', completed: false, category: 'social' },
      { id: 'daily_support_small', title: 'Supporter dévoué', description: 'Encouragez 3 petits streamers', type: 'daily', icon: '👏', progress: 0, target: 3, reward: '+70 XP', completed: false, category: 'social' },
      
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
      { id: 'daily_chat_active', title: 'Bavard du jour', description: 'Interagissez dans 2 chats différents', type: 'daily', icon: '💬', progress: 0, target: 2, reward: '+60 XP', completed: false, category: 'interaction' },
      
      // Achievement
      { id: 'daily_first_time', title: 'Première fois', description: 'Découvrez un jeu que vous n\'avez jamais vu', type: 'daily', icon: '🆕', progress: 0, target: 1, reward: '+80 XP', completed: false, category: 'achievement' },
      { id: 'daily_hidden_gem', title: 'Dénicheur de perles', description: 'Trouvez un streamer avec moins de 10 viewers mais du contenu de qualité', type: 'daily', icon: '💎', progress: 0, target: 1, reward: '+150 XP', completed: false, category: 'achievement' },
      { id: 'daily_comeback', title: 'Retour aux sources', description: 'Revisitez un ancien favori', type: 'daily', icon: '🔙', progress: 0, target: 1, reward: '+40 XP', completed: false, category: 'achievement' },
      { id: 'daily_early_bird', title: 'Lève-tôt', description: 'Découvrez un stream avant 10h', type: 'daily', icon: '🌅', progress: 0, target: 1, reward: '+60 XP', completed: false, category: 'achievement' },
      { id: 'daily_night_owl', title: 'Oiseau de nuit', description: 'Découvrez un stream après 22h', type: 'daily', icon: '🌙', progress: 0, target: 1, reward: '+60 XP', completed: false, category: 'achievement' },
      { id: 'daily_productive_day', title: 'Journée productive', description: 'Découvrez 5 nouveaux streamers en une seule journée', type: 'daily', icon: '⚡', progress: 0, target: 5, reward: '+120 XP', completed: false, category: 'achievement' },
      
      // Méta-quêtes
      { id: 'daily_quest_streak', title: 'Série quotidienne', description: 'Complétez vos quêtes quotidiennes 3 jours d\'affilée', type: 'daily', icon: '🔥', progress: 0, target: 3, reward: '+150 XP', completed: false, category: 'achievement' },
      { id: 'daily_completionist', title: 'Perfectionniste', description: 'Complétez toutes vos quêtes quotidiennes aujourd\'hui', type: 'daily', icon: '✨', progress: 0, target: 1, reward: '+200 XP', completed: false, category: 'achievement' }
    ];

    // Pool de quêtes hebdomadaires (15 quêtes)
    this.questPool.weekly = [
      // Découverte
      { id: 'weekly_discover_20', title: 'Explorateur confirmé', description: 'Découvrez 20 streamers différents', type: 'weekly', icon: '🌟', progress: 0, target: 20, reward: '+500 XP', completed: false, category: 'discovery' },
      { id: 'weekly_discover_35', title: 'Maître explorateur', description: 'Découvrez 35 streamers différents', type: 'weekly', icon: '🔭', progress: 0, target: 35, reward: '+750 XP', completed: false, category: 'discovery' },
      { id: 'weekly_small_only', title: 'Champion des petits', description: 'Découvrez exclusivement des streamers <100 viewers (15 minimum)', type: 'weekly', icon: '🏆', progress: 0, target: 15, reward: '+600 XP', completed: false, category: 'discovery' },
      
      // Social
      { id: 'weekly_favorites_10', title: 'Collectionneur passionné', description: 'Ajoutez 10 nouveaux favoris', type: 'weekly', icon: '⭐', progress: 0, target: 10, reward: '+400 XP', completed: false, category: 'social' },
      { id: 'weekly_community_builder', title: 'Bâtisseur de communauté', description: 'Aidez 5 petits streamers à grandir', type: 'weekly', icon: '🏗️', progress: 0, target: 5, reward: '+550 XP', completed: false, category: 'social' },
      { id: 'weekly_ambassador', title: 'Ambassadeur de la semaine', description: 'Partagez 10 découvertes sur les réseaux', type: 'weekly', icon: '📣', progress: 0, target: 10, reward: '+350 XP', completed: false, category: 'social' },
      
      // Temps
      { id: 'weekly_marathon_4h', title: 'Marathon du week-end', description: 'Regardez 4h de streams ce week-end', type: 'weekly', icon: '🏃', progress: 0, target: 240, reward: '+350 XP', completed: false, category: 'time' },
      { id: 'weekly_daily_consistency', title: 'Régularité hebdomadaire', description: 'Découvrez au moins 1 stream chaque jour de la semaine', type: 'weekly', icon: '📅', progress: 0, target: 7, reward: '+450 XP', completed: false, category: 'time' },
      
      // Variété
      { id: 'weekly_variety_gaming', title: 'Diversité gaming', description: 'Regardez 8 catégories de jeux différentes', type: 'weekly', icon: '🎮', progress: 0, target: 8, reward: '+400 XP', completed: false, category: 'variety' },
      { id: 'weekly_global_explorer', title: 'Explorateur mondial', description: 'Découvrez des streamers de 5 pays différents', type: 'weekly', icon: '🌎', progress: 0, target: 5, reward: '+500 XP', completed: false, category: 'variety' },
      { id: 'weekly_size_diversity', title: 'Diversité d\'audiences', description: 'Regardez des streams de toutes tailles (micro/petit/moyen/grand)', type: 'weekly', icon: '📊', progress: 0, target: 4, reward: '+300 XP', completed: false, category: 'variety' },
      
      // Achievement
      { id: 'weekly_trendsetter', title: 'Lanceur de tendances', description: 'Découvrez 3 jeux en early access ou nouveautés', type: 'weekly', icon: '🚀', progress: 0, target: 3, reward: '+400 XP', completed: false, category: 'achievement' },
      { id: 'weekly_retro_gamer', title: 'Nostalgique', description: 'Regardez 5 streams de jeux rétro/vintage', type: 'weekly', icon: '👾', progress: 0, target: 5, reward: '+350 XP', completed: false, category: 'achievement' },
      { id: 'weekly_genre_master', title: 'Maître de genre', description: 'Devenez expert d\'un genre en regardant 10 streams du même type', type: 'weekly', icon: '🎯', progress: 0, target: 10, reward: '+450 XP', completed: false, category: 'achievement' },
      { id: 'weekly_speed_discovery', title: 'Découverte express', description: 'Découvrez 15 streamers en moins de 3 jours', type: 'weekly', icon: '⚡', progress: 0, target: 15, reward: '+500 XP', completed: false, category: 'achievement' },
      { id: 'weekly_weekend_warrior', title: 'Guerrier du week-end', description: 'Découvrez 15 streams pendant le week-end', type: 'weekly', icon: '🏖️', progress: 0, target: 15, reward: '+400 XP', completed: false, category: 'achievement' }
    ];

    // Pool de quêtes mensuelles (12 quêtes)
    this.questPool.monthly = [
      { id: 'monthly_veteran_20', title: 'Vétéran assidu', description: 'Connectez-vous 20 jours ce mois-ci', type: 'monthly', icon: '🗓️', progress: 0, target: 20, reward: '+1000 XP', completed: false, category: 'achievement' },
      { id: 'monthly_supporter_50', title: 'Supporter du mois', description: 'Ajoutez 50 streamers à vos favoris', type: 'monthly', icon: '🎖️', progress: 0, target: 50, reward: '+800 XP', completed: false, category: 'social' },
      { id: 'monthly_discoverer_100', title: 'Grand découvreur', description: 'Découvrez 100 streamers uniques', type: 'monthly', icon: '🏔️', progress: 0, target: 100, reward: '+1200 XP', completed: false, category: 'discovery' },
      { id: 'monthly_variety_master', title: 'Maître de la variété', description: 'Explorez 20 catégories de jeux différentes', type: 'monthly', icon: '🌈', progress: 0, target: 20, reward: '+900 XP', completed: false, category: 'variety' },
      { id: 'monthly_community_hero', title: 'Héros communautaire', description: 'Aidez 25 petits streamers à grandir', type: 'monthly', icon: '🦸', progress: 0, target: 25, reward: '+1100 XP', completed: false, category: 'social' },
      { id: 'monthly_marathon_20h', title: 'Marathonien légendaire', description: 'Regardez 20h de contenu ce mois', type: 'monthly', icon: '⏰', progress: 0, target: 1200, reward: '+1000 XP', completed: false, category: 'time' },
      { id: 'monthly_global_citizen', title: 'Citoyen du monde', description: 'Découvrez des streamers de 10 pays différents', type: 'monthly', icon: '🌍', progress: 0, target: 10, reward: '+950 XP', completed: false, category: 'variety' },
      { id: 'monthly_trendsetter_supreme', title: 'Maître des tendances', description: 'Soyez parmi les premiers à découvrir 10 nouveaux streamers qui percent', type: 'monthly', icon: '👑', progress: 0, target: 10, reward: '+1500 XP', completed: false, category: 'achievement' },
      
      // Nouvelles quêtes de progression ajoutées
      { id: 'monthly_disciple_level10', title: 'Disciple dévoué', description: 'Atteignez le niveau 10', type: 'monthly', icon: '🥉', progress: 0, target: 10, reward: '+2000 XP', completed: false, category: 'achievement' },
      { id: 'monthly_master_level25', title: 'Maître persévérant', description: 'Atteignez le niveau 25', type: 'monthly', icon: '🥈', progress: 0, target: 25, reward: '+5000 XP', completed: false, category: 'achievement' },
      { id: 'monthly_legend_level50', title: 'Légende éternelle', description: 'Atteignez le niveau 50', type: 'monthly', icon: '🥇', progress: 0, target: 50, reward: '+10000 XP', completed: false, category: 'achievement' },
      { id: 'monthly_quest_completionist', title: 'Perfectionniste suprême', description: 'Complétez 50 quêtes ce mois-ci', type: 'monthly', icon: '✨', progress: 0, target: 50, reward: '+2500 XP', completed: false, category: 'achievement' }
    ];
  }

  private generateRandomQuests() {
    // Générer des quêtes aléatoires pour chaque utilisateur
    // Quotidiennes: 4 quêtes parmi 25 possibles
    const dailyQuests = this.getRandomQuests(this.questPool.daily, 4);
    
    // Hebdomadaires: 3 quêtes parmi 20 possibles  
    const weeklyQuests = this.getRandomQuests(this.questPool.weekly, 3);
    
    // Mensuelles: 2 quêtes parmi 12 possibles
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
    // Succès permanents plus variés (12 achievements)
    this.achievements = [
      // Achievements communs
      { id: 'first_discovery', title: 'Premier Pas', description: 'Découvrez votre premier streamer', icon: '🥇', completed: true, rarity: 'common' },
      { id: 'early_supporter', title: 'Supporter précoce', description: 'Ajoutez votre premier favori', icon: '❤️', completed: true, rarity: 'common' },
      { id: 'social_butterfly', title: 'Papillon Social', description: 'Interagissez dans 5 chats différents', icon: '🦋', completed: true, progress: 5, target: 5, rarity: 'common' },
      
      // Achievements rares
      { id: 'small_streamer_friend', title: 'Ami des Petits', description: 'Découvrez 50 streamers avec moins de 100 viewers', icon: '🌱', completed: false, progress: 23, target: 50, rarity: 'rare' },
      { id: 'variety_seeker', title: 'Chercheur de Variété', description: 'Explorez 25 catégories de jeux différentes', icon: '🎯', completed: false, progress: 12, target: 25, rarity: 'rare' },
      { id: 'night_explorer', title: 'Explorateur Nocturne', description: 'Découvrez 20 streams après minuit', icon: '🌙', completed: false, progress: 7, target: 20, rarity: 'rare' },
      
      // Achievements épiques
      { id: 'community_builder', title: 'Bâtisseur de Communauté', description: 'Aidez 100 petits streamers à grandir', icon: '🏗️', completed: false, progress: 45, target: 100, rarity: 'epic' },
      { id: 'globe_trotter', title: 'Globe-trotter', description: 'Découvrez des streamers de 15 pays différents', icon: '🌍', completed: false, progress: 8, target: 15, rarity: 'epic' },
      { id: 'marathon_master', title: 'Maître du Marathon', description: 'Regardez 100h de contenu au total', icon: '⏰', completed: false, progress: 67, target: 100, rarity: 'epic' },
      
      // Achievements légendaires
      { id: 'discovery_legend', title: 'Légende de la Découverte', description: 'Découvrez 1000 streamers uniques', icon: '👑', completed: false, progress: 342, target: 1000, rarity: 'legendary' },
      { id: 'influencer', title: 'Influenceur de la Plateforme', description: 'Aidez 10 streamers à atteindre 1000+ followers grâce à vos découvertes', icon: '⭐', completed: false, progress: 3, target: 10, rarity: 'legendary' },
      { id: 'platform_veteran', title: 'Vétéran de la Plateforme', description: 'Utilisez Streamyscovery pendant 365 jours', icon: '🏆', completed: false, progress: 127, target: 365, rarity: 'legendary' }
    ];
  }

  getProgressPercentage(progress: number, target: number): number {
    return Math.min((progress / target) * 100, 100);
  }

  getQuestsByType(type: 'daily' | 'weekly' | 'monthly'): Quest[] {
    return this.quests.filter(quest => quest.type === type);
  }
}
