import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PremiumService, UserTier } from '../../services/premium.service';
import { UserProgressionService } from '../../services/user-progression.service';

interface AnalyticsData {
  totalXP: number;
  level: number;
  streamsDiscovered: number;
  favoritesAdded: number;
  questsCompleted: number;
  dailyStreak: number;
  averageSessionTime: number;
  topCategories: { name: string; count: number }[];
  weeklyProgress: { day: string; xp: number }[];
  monthlyStats: {
    discoveries: number;
    favorites: number;
    xpGained: number;
    questsCompleted: number;
  };
}

@Component({
  selector: 'app-premium-analytics',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="analytics-container" *ngIf="hasAnalyticsAccess">
      <!-- Header -->
      <div class="analytics-header">
        <h1 class="title">📊 Analytics Premium</h1>
        <div class="tier-badge" [class]="'badge-' + currentTier.tier">
          {{ currentTier.badge }} {{ currentTier.displayName }}
        </div>
      </div>

      <!-- Quick Stats Grid -->
      <div class="quick-stats-grid">
        <div class="stat-card stat-xp">
          <div class="stat-icon">⚡</div>
          <div class="stat-content">
            <h3>{{ formatNumber(analytics.totalXP) }}</h3>
            <p>XP Total</p>
          </div>
        </div>
        
        <div class="stat-card stat-level">
          <div class="stat-icon">🏆</div>
          <div class="stat-content">
            <h3>{{ analytics.level }}</h3>
            <p>Niveau Actuel</p>
          </div>
        </div>

        <div class="stat-card stat-discoveries">
          <div class="stat-icon">🔍</div>
          <div class="stat-content">
            <h3>{{ analytics.streamsDiscovered }}</h3>
            <p>Découvertes</p>
          </div>
        </div>

        <div class="stat-card stat-favorites">
          <div class="stat-icon">❤️</div>
          <div class="stat-content">
            <h3>{{ analytics.favoritesAdded }}</h3>
            <p>Favoris</p>
          </div>
        </div>
      </div>

      <!-- Detailed Analytics (VIP+ Only) -->
      <div class="detailed-analytics" *ngIf="isVipOrHigher">
        <!-- Weekly Progress Chart -->
        <div class="chart-section">
          <h2>📈 Progression Hebdomadaire</h2>
          <div class="progress-chart">
            <div 
              *ngFor="let day of analytics.weeklyProgress" 
              class="progress-bar"
              [style.height.%]="getProgressBarHeight(day.xp)"
            >
              <div class="bar-value">{{ day.xp }}</div>
              <div class="bar-label">{{ day.day }}</div>
            </div>
          </div>
        </div>

        <!-- Top Categories -->
        <div class="categories-section">
          <h2>🎮 Catégories Préférées</h2>
          <div class="categories-list">
            <div 
              *ngFor="let category of analytics.topCategories; let i = index" 
              class="category-item"
            >
              <span class="category-rank">#{{ i + 1 }}</span>
              <span class="category-name">{{ category.name }}</span>
              <span class="category-count">{{ category.count }} streams</span>
            </div>
          </div>
        </div>

        <!-- Monthly Summary -->
        <div class="monthly-summary">
          <h2>📅 Résumé du Mois</h2>
          <div class="summary-grid">
            <div class="summary-item">
              <strong>{{ analytics.monthlyStats.discoveries }}</strong>
              <span>Nouvelles découvertes</span>
            </div>
            <div class="summary-item">
              <strong>{{ analytics.monthlyStats.favorites }}</strong>
              <span>Favoris ajoutés</span>
            </div>
            <div class="summary-item">
              <strong>{{ formatNumber(analytics.monthlyStats.xpGained) }}</strong>
              <span>XP gagné</span>
            </div>
            <div class="summary-item">
              <strong>{{ analytics.monthlyStats.questsCompleted }}</strong>
              <span>Quêtes complétées</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Premium Features Showcase -->
      <div class="premium-showcase">
        <h2>✨ Fonctionnalités Premium Active</h2>
        <div class="features-grid">
          <div class="feature-item" *ngFor="let feature of currentTier.features">
            <span class="feature-check">✅</span>
            <span class="feature-text">{{ feature }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Access Denied (Free Users) -->
    <div class="access-denied" *ngIf="!hasAnalyticsAccess">
      <div class="denied-content">
        <div class="denied-icon">🔒</div>
        <h2>Analytics Premium</h2>
        <p>Les analytics avancées sont disponibles pour les utilisateurs VIP et Légendaires.</p>
        <button class="upgrade-button" (click)="redirectToSubscription()">
          Passer au VIP
        </button>
      </div>
    </div>
  `,
  styleUrl: './premium-analytics.component.scss'
})
export class PremiumAnalyticsComponent implements OnInit {
  currentTier: UserTier;
  hasAnalyticsAccess = false;
  isVipOrHigher = false;
  analytics: AnalyticsData = {
    totalXP: 0,
    level: 1,
    streamsDiscovered: 0,
    favoritesAdded: 0,
    questsCompleted: 0,
    dailyStreak: 0,
    averageSessionTime: 0,
    topCategories: [],
    weeklyProgress: [],
    monthlyStats: {
      discoveries: 0,
      favorites: 0,
      xpGained: 0,
      questsCompleted: 0
    }
  };

  constructor(
    private premiumService: PremiumService,
    private userProgressionService: UserProgressionService
  ) {
    this.currentTier = this.premiumService.getCurrentTier();
    this.checkAccess();
  }

  ngOnInit() {
    if (this.hasAnalyticsAccess) {
      this.loadAnalyticsData();
    }
  }

  private checkAccess() {
    this.hasAnalyticsAccess = this.currentTier.tier === 'vip' || this.currentTier.tier === 'legendary';
    this.isVipOrHigher = this.hasAnalyticsAccess;
  }

  private loadAnalyticsData() {
    // Simuler des données analytics (à remplacer par vraies données)
    this.analytics = {
      totalXP: 45890,
      level: 23,
      streamsDiscovered: 342,
      favoritesAdded: 89,
      questsCompleted: 156,
      dailyStreak: 12,
      averageSessionTime: 25,
      topCategories: [
        { name: 'Just Chatting', count: 45 },
        { name: 'League of Legends', count: 32 },
        { name: 'Minecraft', count: 28 },
        { name: 'Counter-Strike', count: 24 },
        { name: 'IRL', count: 18 }
      ],
      weeklyProgress: [
        { day: 'Lun', xp: 1200 },
        { day: 'Mar', xp: 1800 },
        { day: 'Mer', xp: 950 },
        { day: 'Jeu', xp: 2100 },
        { day: 'Ven', xp: 1650 },
        { day: 'Sam', xp: 2400 },
        { day: 'Dim', xp: 1890 }
      ],
      monthlyStats: {
        discoveries: 127,
        favorites: 34,
        xpGained: 12450,
        questsCompleted: 67
      }
    };

    console.log('📊 Analytics chargées pour', this.currentTier.displayName);
  }

  formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  getProgressBarHeight(xp: number): number {
    const maxXP = Math.max(...this.analytics.weeklyProgress.map(p => p.xp));
    return (xp / maxXP) * 100;
  }

  redirectToSubscription() {
    window.location.href = '/subscription';
  }
}
