import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface UserTier {
  tier: 'free' | 'premium' | 'vip' | 'legendary';
  displayName: string;
  xpBoost: number;
  dailyQuests: number;
  weeklyQuests: number;
  monthlyQuests: number;
  features: string[];
  badge?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PremiumService {
  private currentTierSubject = new BehaviorSubject<UserTier>(this.getFreeTier());
  public currentTier$ = this.currentTierSubject.asObservable();

  constructor() {
    // Charger le tier depuis le localStorage au démarrage
    const savedTier = localStorage.getItem('userTier') as 'free' | 'premium' | 'vip' | 'legendary';
    if (savedTier) {
      this.updateUserTier(savedTier);
    }
  }

  /**
   * Définitions des tiers d'abonnement
   */
  private getTierDefinitions(): Record<string, UserTier> {
    return {
      free: {
        tier: 'free',
        displayName: 'Gratuit',
        xpBoost: 0,
        dailyQuests: 6,
        weeklyQuests: 4,
        monthlyQuests: 3,
        features: [
          'Accès tous niveaux 1-200',
          '6 quêtes quotidiennes',
          '4 quêtes hebdomadaires', 
          '3 quêtes mensuelles',
          'Interface standard'
        ]
      },
      premium: {
        tier: 'premium',
        displayName: 'Premium',
        xpBoost: 5,
        dailyQuests: 8,
        weeklyQuests: 5,
        monthlyQuests: 4,
        features: [
          'Boost XP +5%',
          '8 quêtes quotidiennes (+2)',
          '5 quêtes hebdomadaires (+1)',
          '4 quêtes mensuelles (+1)',
          'Quêtes premium exclusives',
          'Badge Premium exclusif'
        ],
        badge: '⭐'
      },
      vip: {
        tier: 'vip',
        displayName: 'VIP',
        xpBoost: 10,
        dailyQuests: 9,
        weeklyQuests: 6,
        monthlyQuests: 5,
        features: [
          'Boost XP +10%',
          '9 quêtes quotidiennes (+3)',
          '6 quêtes hebdomadaires (+2)',
          '5 quêtes mensuelles (+2)',
          'Quêtes VIP exclusives',
          'Analytics personnalisées',
          'Support prioritaire'
        ],
        badge: '👑'
      },
      legendary: {
        tier: 'legendary',
        displayName: 'Légendaire',
        xpBoost: 15,
        dailyQuests: 10,
        weeklyQuests: 7,
        monthlyQuests: 6,
        features: [
          'Boost XP +15%',
          '10 quêtes quotidiennes (+4)',
          '7 quêtes hebdomadaires (+3)',
          '6 quêtes mensuelles (+3)',
          'Analytics avancées',
          'Support prioritaire',
          'Badge animé personnalisé'
        ],
        badge: '✨'
      }
    };
  }

  /**
   * Obtenir le tier gratuit par défaut
   */
  private getFreeTier(): UserTier {
    return this.getTierDefinitions()['free'];
  }

  /**
   * Obtenir le tier actuel de l'utilisateur
   */
  getCurrentTier(): UserTier {
    return this.currentTierSubject.value;
  }

  /**
   * Mettre à jour le tier de l'utilisateur
   */
  updateUserTier(newTier: 'free' | 'premium' | 'vip' | 'legendary'): void {
    const tierDef = this.getTierDefinitions()[newTier];
    if (tierDef) {
      this.currentTierSubject.next(tierDef);
      localStorage.setItem('userTier', newTier);
      console.log(`🎉 Tier mis à jour vers: ${tierDef.displayName}`);
    }
  }

  /**
   * Obtenir le nombre de quêtes quotidiennes selon le tier
   */
  getDailyQuestsCount(): number {
    return this.getCurrentTier().dailyQuests;
  }

  /**
   * Obtenir le nombre de quêtes hebdomadaires selon le tier
   */
  getWeeklyQuestsCount(): number {
    return this.getCurrentTier().weeklyQuests;
  }

  /**
   * Obtenir le nombre de quêtes mensuelles selon le tier
   */
  getMonthlyQuestsCount(): number {
    return this.getCurrentTier().monthlyQuests;
  }

  /**
   * Vérifier si l'utilisateur a accès à une fonctionnalité premium
   */
  hasFeatureAccess(feature: string): boolean {
    const currentTier = this.getCurrentTier();
    return currentTier.features.some(f => f.toLowerCase().includes(feature.toLowerCase()));
  }

  /**
   * Obtenir les fonctionnalités du tier actuel
   */
  getCurrentFeatures(): string[] {
    return this.getCurrentTier().features;
  }

  /**
   * Vérifier si l'utilisateur a accès aux analytics
   */
  hasAnalyticsAccess(): boolean {
    const tier = this.getCurrentTier().tier;
    return tier === 'vip' || tier === 'legendary';
  }

  /**
   * Calculer l'XP avec boost
   */
  calculateBoostedXP(baseXP: number): number {
    const boost = this.getCurrentTier().xpBoost;
    return Math.floor(baseXP * (1 + boost / 100));
  }

  /**
   * Obtenir tous les tiers disponibles
   */
  getAllTiers(): UserTier[] {
    const tiers = this.getTierDefinitions();
    return Object.values(tiers);
  }

  /**
   * Test: Obtenir un tier spécifique
   */
  getTier(tierName: 'free' | 'premium' | 'vip' | 'legendary'): UserTier {
    return this.getTierDefinitions()[tierName];
  }

  /**
   * Obtenir le pourcentage de boost XP
   */
  getXPBoostPercentage(): number {
    return this.getCurrentTier().xpBoost;
  }

  /**
   * Calculer l'XP avec le boost appliqué
   */
  calculateXPWithBoost(baseXP: number): number {
    const boost = this.getCurrentTier().xpBoost;
    return Math.floor(baseXP * (1 + boost / 100));
  }

  /**
   * Vérifier si l'utilisateur est premium (non-gratuit)
   */
  isPremiumUser(): boolean {
    return this.getCurrentTier().tier !== 'free';
  }
}
