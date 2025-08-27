import { Component, OnInit, EventEmitter, Output, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { PremiumService, UserTier } from '../../services/premium.service';
import { UserProgressionService } from '../../services/user-progression.service';

interface UserProfile {
  id: string;
  username: string;
  avatarUrl: string;
  level: number;
  currentXP: number;
  nextLevelXP: number;
  totalXP: number;
  badges: string[];
  titles: string[];
  currentTitle?: string;
  streamsDiscovered: number;
  favoritesAdded: number;
  subscriptionTier: 'free' | 'premium' | 'vip' | 'legendary';
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockedAt?: Date;
}

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="profile-modal-overlay" (click)="closeProfile()" *ngIf="isOpen">
      <div class="profile-modal" (click)="$event.stopPropagation()">
        
        <!-- Header du profil -->
        <div class="profile-header">
          <div class="profile-avatar">
            <img [src]="userProfile?.avatarUrl" [alt]="userProfile?.username" />
            <div class="level-badge">{{ userProfile?.level }}</div>
          </div>
          
          <div class="profile-info">
            <h2>{{ userProfile?.username }}</h2>
            <div class="current-title" *ngIf="userProfile?.currentTitle">
              🏆 {{ userProfile?.currentTitle }}
            </div>
            <div class="subscription-tier tier-{{ userProfile?.subscriptionTier }}">
              {{ getSubscriptionLabel(userProfile?.subscriptionTier) }}
            </div>
          </div>
          
          <button class="close-btn" (click)="closeProfile()">&times;</button>
        </div>

        <!-- Progression XP -->
        <div class="xp-section">
          <div class="xp-info">
            <span class="current-xp">{{ userProfile?.currentXP }} / {{ userProfile?.nextLevelXP }} XP</span>
            <span class="next-level">Vers le niveau {{ (userProfile?.level || 0) + 1 }}</span>
          </div>
          <div class="xp-bar">
            <div class="xp-fill" [style.width.%]="getXPPercentage()"></div>
          </div>
          <div class="total-xp">Total : {{ userProfile?.totalXP }} XP</div>
          <div class="xp-boost" *ngIf="getXPBoostPercentage() > 0">
            ⚡ Boost XP: +{{ getXPBoostPercentage() }}%
          </div>
        </div>

        <!-- Statistiques -->
        <div class="stats-section">
          <h3>📊 Statistiques</h3>
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-value">{{ userProfile?.streamsDiscovered }}</div>
              <div class="stat-label">Streams découverts</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">{{ userProfile?.favoritesAdded }}</div>
              <div class="stat-label">Favoris ajoutés</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">{{ userProfile?.badges?.length || 0 }}</div>
              <div class="stat-label">Badges obtenus</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">{{ userProfile?.titles?.length || 0 }}</div>
              <div class="stat-label">Titres débloqués</div>
            </div>
          </div>
        </div>

        <!-- Badges -->
        <div class="badges-section">
          <h3>🏅 Badges & Récompenses</h3>
          <div class="badges-grid">
            <div class="badge-item" 
                 *ngFor="let badge of displayedBadges" 
                 [class.locked]="!isBadgeUnlocked(badge.id)">
              <div class="badge-icon">{{ badge.icon }}</div>
              <div class="badge-info">
                <div class="badge-name">{{ badge.name }}</div>
                <div class="badge-description">{{ badge.description }}</div>
                <div class="badge-rarity rarity-{{ badge.rarity }}">{{ badge.rarity }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Titres disponibles -->
        <div class="titles-section" *ngIf="userProfile && userProfile.titles && userProfile.titles.length > 0">
          <h3>👑 Titres disponibles</h3>
          <div class="titles-list">
            <button class="title-btn" 
                    *ngFor="let title of userProfile.titles"
                    [class.active]="title === userProfile.currentTitle"
                    (click)="selectTitle(title)">
              {{ title }}
            </button>
          </div>
        </div>

        <!-- Actions -->
        <div class="profile-actions">
          <button class="btn btn-primary" (click)="viewQuests()">
            🎯 Voir mes quêtes
          </button>
          <button class="btn btn-secondary" (click)="viewLeaderboard()">
            🏆 Classements
          </button>
          <button class="btn btn-premium" *ngIf="userProfile?.subscriptionTier === 'free'" (click)="upgradePremium()">
            ⭐ Passer Premium
          </button>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .profile-modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }

    .profile-modal {
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      border-radius: 20px;
      padding: 2rem;
      max-width: 600px;
      width: 90%;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
      border: 2px solid #9146ff;
    }

    .profile-header {
      display: flex;
      align-items: flex-start;
      gap: 2rem; // Augmenté de 1.5rem à 2rem
      margin-bottom: 2rem;
      position: relative;
      padding-right: 3rem; // Espace pour le bouton de fermeture
    }

    .profile-avatar {
      position: relative;
      flex-shrink: 0; // Empêche la compression
      min-width: 80px; // Largeur minimale garantie
    }

    .profile-avatar img {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      border: 3px solid #9146ff;
    }

    .level-badge {
      position: absolute;
      bottom: -5px;
      right: -5px;
      background: linear-gradient(45deg, #ff6b6b, #ffd93d);
      color: #000;
      border-radius: 50%;
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 0.8rem;
      border: 2px solid white;
      z-index: 2; // Au-dessus de l'avatar
    }

    .profile-info {
      flex: 1;
      min-width: 0; // Permet le wrapping du texte
      margin-left: 0.5rem; // Espace supplémentaire par rapport à l'avatar
    }

    .profile-info h2 {
      margin: 0 0 0.75rem 0; // Augmenté la marge du bas
      color: #fff;
      font-size: 1.5rem;
      word-break: break-word; // Évite le débordement
    }

    .current-title {
      color: #ffd93d;
      font-size: 0.9rem;
      margin-bottom: 0.75rem; // Augmenté de 0.5rem à 0.75rem
      display: block;
    }

    .subscription-tier {
      padding: 0.4rem 1rem; // Augmenté le padding
      border-radius: 20px; // Plus arrondi
      font-size: 0.8rem;
      font-weight: bold;
      display: inline-block;
      margin-top: 0.25rem; // Petit espace au-dessus
      white-space: nowrap; // Empêche le wrap du texte
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3); // Ombre pour la profondeur
    }

    .tier-free { background: #555; color: #fff; }
    .tier-premium { background: linear-gradient(45deg, #9146ff, #b794f6); color: #fff; }
    .tier-vip { background: linear-gradient(45deg, #ffd700, #ffed4e); color: #000; }
    .tier-legendary { background: linear-gradient(45deg, #ff6b35, #f7931e); color: #fff; }

    .close-btn {
      position: absolute;
      top: -10px;
      right: -10px;
      background: #ff4757;
      color: white;
      border: none;
      border-radius: 50%;
      width: 30px;
      height: 30px;
      font-size: 1.2rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10; // Au-dessus de tout
      transition: all 0.2s ease;
    }

    .close-btn:hover {
      background: #ff3838;
      transform: scale(1.1);
    }

    .xp-section {
      background: rgba(145, 70, 255, 0.1);
      padding: 1rem;
      border-radius: 10px;
      margin-bottom: 2rem;
      border: 1px solid rgba(145, 70, 255, 0.3);
    }

    .xp-info {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.5rem;
      color: #fff;
      font-size: 0.9rem;
    }

    .xp-bar {
      background: rgba(255, 255, 255, 0.1);
      height: 10px;
      border-radius: 5px;
      overflow: hidden;
      margin-bottom: 0.5rem;
    }

    .xp-fill {
      background: linear-gradient(90deg, #9146ff, #b794f6);
      height: 100%;
      transition: width 0.3s ease;
    }

    .total-xp {
      text-align: center;
      color: #aaa;
      font-size: 0.8rem;
    }

    .xp-boost {
      text-align: center;
      color: #ffd700;
      font-size: 0.85rem;
      font-weight: bold;
      margin-top: 0.5rem;
      background: rgba(255, 215, 0, 0.1);
      padding: 0.3rem 0.8rem;
      border-radius: 15px;
      border: 1px solid rgba(255, 215, 0, 0.3);
    }

    .stats-section, .badges-section, .titles-section {
      margin-bottom: 2rem;
    }

    .stats-section h3, .badges-section h3, .titles-section h3 {
      color: #fff;
      margin-bottom: 1rem;
      font-size: 1.2rem;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
    }

    .stat-card {
      background: rgba(255, 255, 255, 0.05);
      padding: 1rem;
      border-radius: 10px;
      text-align: center;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .stat-value {
      font-size: 1.5rem;
      font-weight: bold;
      color: #9146ff;
      margin-bottom: 0.25rem;
    }

    .stat-label {
      color: #aaa;
      font-size: 0.8rem;
    }

    .badges-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 0.75rem;
      max-height: 200px;
      overflow-y: auto;
    }

    .badge-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      background: rgba(255, 255, 255, 0.05);
      padding: 0.75rem;
      border-radius: 8px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      transition: all 0.3s ease;
    }

    .badge-item:not(.locked):hover {
      background: rgba(145, 70, 255, 0.2);
      border-color: #9146ff;
    }

    .badge-item.locked {
      opacity: 0.4;
      filter: grayscale(100%);
    }

    .badge-icon {
      font-size: 1.5rem;
      width: 40px;
      text-align: center;
    }

    .badge-name {
      color: #fff;
      font-weight: bold;
      margin-bottom: 0.25rem;
    }

    .badge-description {
      color: #aaa;
      font-size: 0.8rem;
      margin-bottom: 0.25rem;
    }

    .badge-rarity {
      font-size: 0.7rem;
      text-transform: uppercase;
      font-weight: bold;
    }

    .rarity-common { color: #95a5a6; }
    .rarity-rare { color: #3498db; }
    .rarity-epic { color: #9b59b6; }
    .rarity-legendary { color: #f39c12; }

    .titles-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .title-btn {
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: #fff;
      padding: 0.5rem 1rem;
      border-radius: 20px;
      cursor: pointer;
      transition: all 0.3s ease;
      font-size: 0.8rem;
    }

    .title-btn:hover {
      background: rgba(145, 70, 255, 0.3);
      border-color: #9146ff;
    }

    .title-btn.active {
      background: #9146ff;
      border-color: #9146ff;
    }

    .profile-actions {
      display: flex;
      gap: 1rem;
      justify-content: center;
      flex-wrap: wrap;
    }

    .btn {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-weight: bold;
      transition: all 0.3s ease;
      text-decoration: none;
      display: inline-block;
    }

    .btn-primary {
      background: #9146ff;
      color: white;
    }

    .btn-primary:hover {
      background: #7c3aed;
      transform: translateY(-2px);
    }

    .btn-secondary {
      background: rgba(255, 255, 255, 0.1);
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .btn-secondary:hover {
      background: rgba(255, 255, 255, 0.2);
    }

    .btn-premium {
      background: linear-gradient(45deg, #ffd700, #ffed4e);
      color: #000;
    }

    .btn-premium:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 20px rgba(255, 215, 0, 0.3);
    }

    @media (max-width: 768px) {
      .profile-modal {
        margin: 1rem;
        padding: 1.5rem;
      }
      
      .stats-grid {
        grid-template-columns: 1fr;
      }
      
      .profile-actions {
        flex-direction: column;
      }
    }
  `]
})
export class UserProfileComponent implements OnInit, OnDestroy {
  isOpen = false;
  userProfile: UserProfile | null = null;
  
  @Output() openQuestsEvent = new EventEmitter<void>();
  
  private subscriptions = new Subscription();
  
  // Liste des badges disponibles
  availableBadges: Badge[] = [
    {
      id: 'first_discovery',
      name: 'Premier Pas',
      description: 'Découverte du premier stream',
      icon: '🎯',
      rarity: 'common'
    },
    {
      id: 'daily_explorer',
      name: 'Explorateur Quotidien',
      description: 'Complété une quête quotidienne',
      icon: '🔍',
      rarity: 'common'
    },
    {
      id: 'social_butterfly',
      name: 'Papillon Social',
      description: 'Ajouté un favori',
      icon: '💝',
      rarity: 'common'
    },
    {
      id: 'underdog_champion',
      name: 'Champion des Petits',
      description: 'Découvert 10 petits streamers',
      icon: '🏆',
      rarity: 'rare'
    },
    {
      id: 'variety_seeker',
      name: 'Chercheur de Variété',
      description: 'Découvert 5 jeux différents',
      icon: '🎮',
      rarity: 'rare'
    },
    {
      id: 'community_builder',
      name: 'Bâtisseur de Communauté',
      description: 'Aidé 20 petits streamers',
      icon: '🏗️',
      rarity: 'epic'
    },
    {
      id: 'discovery_master',
      name: 'Maître Découvreur',
      description: 'Découvert 100 streams',
      icon: '👑',
      rarity: 'legendary'
    }
  ];

  displayedBadges: Badge[] = [];

  constructor(
    private authService: AuthService,
    private router: Router,
    private premiumService: PremiumService,
    private userProgressionService: UserProgressionService,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.displayedBadges = this.availableBadges;
    
    // S'abonner aux changements de tier premium pour mettre à jour le profil
    this.subscriptions.add(
      this.premiumService.currentTier$.subscribe(tier => {
        if (this.userProfile) {
          this.userProfile.subscriptionTier = tier.tier as any;
        }
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  openProfile() {
    this.isOpen = true;
    this.loadUserProfile();
  }

  closeProfile() {
    this.isOpen = false;
  }

  private async loadUserProfile() {
    try {
      console.log('🔄 Chargement du profil utilisateur...');
      
      // Récupérer les données utilisateur réelles depuis le service auth
      this.authService.user$.subscribe(async user => {
        if (user) {
          console.log('👤 Utilisateur trouvé:', user.username);
          
          // Récupérer les données réelles de progression
          this.userProgressionService.getUserProgression().subscribe(async userProgress => {
            console.log('📊 Données de progression récupérées:', userProgress);
            
            // Récupérer les vrais favoris
            const realFavorites = await this.getRealFavorites();
            console.log('❤️ Favoris réels récupérés:', realFavorites?.length || 0);
            
            const currentTier = this.premiumService.getCurrentTier();
            console.log('🔍 Tier récupéré depuis PremiumService:', currentTier);
            console.log('🔍 Type de currentTier.tier:', typeof currentTier?.tier);
            console.log('🔍 Valeur exacte de currentTier.tier:', JSON.stringify(currentTier?.tier));
            
            // Mapper correctement le tier
            let subscriptionTier: 'free' | 'premium' | 'vip' | 'legendary' = 'free';
            if (currentTier && currentTier.tier) {
              const tierName = currentTier.tier.toLowerCase().trim();
              console.log('🎯 Nom du tier normalisé:', JSON.stringify(tierName));
              if (['premium', 'vip', 'legendary'].includes(tierName)) {
                subscriptionTier = tierName as 'premium' | 'vip' | 'legendary';
                console.log('✅ Tier mappé avec succès:', subscriptionTier);
              } else {
                console.log('⚠️ Tier non reconnu, defaulting to free. Tier reçu:', tierName);
              }
            } else {
              console.log('⚠️ currentTier ou currentTier.tier est null/undefined');
            }
            
            this.userProfile = {
              id: user.id,
              username: user.username,
              avatarUrl: user.avatar_url || 'assets/default-avatar.png',
              level: userProgress?.level || 1,
              currentXP: userProgress?.currentXP || 0,
              nextLevelXP: userProgress?.nextLevelXP || 1000,
              totalXP: userProgress?.totalXP || 0,
              badges: userProgress?.badges || [],
              titles: userProgress?.titles || [],
              currentTitle: userProgress?.currentTitle || 'Novice',
              streamsDiscovered: userProgress?.streamsDiscovered || 0,
              favoritesAdded: realFavorites ? realFavorites.length : 0, // Vrais favoris
              subscriptionTier: subscriptionTier
            };

            console.log('✅ Profil utilisateur final chargé:', this.userProfile);
            console.log('🎯 Subscription tier final:', subscriptionTier);
            console.log('⚡ XP actuel:', this.userProfile.currentXP);
            console.log('📈 XP total:', this.userProfile.totalXP);
            console.log('🖼️ Avatar URL:', this.userProfile.avatarUrl);
          });
        }
      });
    } catch (error) {
      console.error('❌ Erreur lors du chargement du profil:', error);
    }
  }

  getXPPercentage(): number {
    if (!this.userProfile || !this.userProfile.nextLevelXP) return 0;
    
    const percentage = (this.userProfile.currentXP / this.userProfile.nextLevelXP) * 100;
    
    // Limiter le pourcentage à 100% maximum pour éviter la jauge qui déborde
    return Math.min(percentage, 100);
  }

  getXPBoostPercentage(): number {
    return this.premiumService.getXPBoostPercentage();
  }

  getSubscriptionLabel(tier?: string): string {
    switch (tier) {
      case 'premium': return 'Premium';
      case 'vip': return 'VIP';
      case 'legendary': return 'Légendaire';
      default: return 'Gratuit';
    }
  }

  isBadgeUnlocked(badgeId: string): boolean {
    return this.userProfile?.badges.includes(badgeId) || false;
  }

  selectTitle(title: string) {
    if (this.userProfile) {
      this.userProfile.currentTitle = title;
      // TODO: Envoyer la mise à jour au backend
    }
  }

  viewQuests() {
    this.openQuestsEvent.emit();
    this.closeProfile(); // Fermer le profil quand on ouvre les quêtes
  }

  viewLeaderboard() {
    // TODO: Ouvrir le classement
    console.log('Ouverture du classement');
  }

  upgradePremium() {
    console.log('🚀 Redirection vers la page Premium');
    // Fermer le modal de profil
    this.closeProfile();
    // Rediriger vers la page d'abonnement
    this.router.navigate(['/subscription']);
  }

  private async getRealFavorites(): Promise<any[]> {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return [];
      }

      const response = await this.http.get<any>('http://localhost:3000/api/favorites', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }).toPromise();

      return response.data || [];
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des favoris:', error);
      return [];
    }
  }
}
