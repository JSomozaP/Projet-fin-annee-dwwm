/**
 * Streamyscovery - Main Application Component
 * Copyright (c) 2025 Jeremy Somoza. Tous droits réservés.
 * 
 * Composant principal de l'application avec navigation responsive et gestion d'état.
 * Intègre l'authentification, les quêtes et le système premium.
 * 
 * @author Jeremy Somoza
 * @project Streamyscovery
 * @date 2025
 */

import { Component, OnInit, OnDestroy, inject, ViewChild } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';

import { AuthService, User } from './services/auth.service';
import { FavoriteService } from './services/favorite.service';
import { PremiumService, UserTier } from './services/premium.service';
import { UserProfileComponent } from './components/user-profile/user-profile.component';
import { QuestsComponent } from './components/quests/quests.component';
import { QuestNotificationComponent } from './components/quest-notification/quest-notification.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, UserProfileComponent, QuestsComponent, QuestNotificationComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'Streamyscovery';
  
  // États de l'authentification
  isAuthenticated = false;
  user: User | null = null;
  favoriteCount = 0;

  // États premium - initialisation directe pour éviter l'erreur TS
  currentTier: UserTier = { tier: 'free', displayName: 'Gratuit', xpBoost: 0, dailyQuests: 6, weeklyQuests: 4, monthlyQuests: 3, features: [] };
  hasAnalyticsAccess = false;

  // États des modals footer
  showAboutModal = false;
  showPrivacyModal = false;
  showContactModal = false;
  
  // État du menu burger mobile
  isMobileMenuOpen = false;

  private destroy$ = new Subject<void>();

  // Injection des services avec le nouveau système
  private authService = inject(AuthService);
  private favoriteService = inject(FavoriteService);
  private premiumService = inject(PremiumService);

  // Référence au composant profil utilisateur
  @ViewChild(UserProfileComponent) userProfile!: UserProfileComponent;
  
  // Référence au composant quêtes
  @ViewChild(QuestsComponent) questsComponent!: QuestsComponent;

  ngOnInit(): void {
    // 🔥 INITIALISER LE TIER PREMIUM EN PREMIER
    this.currentTier = this.premiumService.getCurrentTier();
    this.hasAnalyticsAccess = this.premiumService.hasAnalyticsAccess();
    
    // Écouter les changements de tier premium
    this.premiumService.currentTier$
      .pipe(takeUntil(this.destroy$))
      .subscribe(tier => {
        console.log('🎉 App: Tier updated to:', tier.displayName);
        this.currentTier = tier;
        this.hasAnalyticsAccess = this.premiumService.hasAnalyticsAccess();
      });

    // Écouter les changements d'authentification
    this.authService.isAuthenticated$
      .pipe(takeUntil(this.destroy$))
      .subscribe(isAuth => {
        this.isAuthenticated = isAuth;
      });

    // Écouter les changements d'utilisateur
    this.authService.user$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.user = user;
      });

    // Écouter les changements de favoris
    this.favoriteService.favorites$
      .pipe(takeUntil(this.destroy$))
      .subscribe(favorites => {
        this.favoriteCount = favorites.length;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Actions d'authentification
  login(): void {
    this.authService.redirectToTwitchAuth();
  }

  logout(): void {
    this.authService.logout();
  }

  // Génère un avatar par défaut pour l'utilisateur
  getDefaultUserAvatar(username: string): string {
    if (!username) return this.generateUserAvatarUrl('?');
    
    const initials = username
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
    
    return this.generateUserAvatarUrl(initials || username.charAt(0).toUpperCase());
  }

  // Génère une URL d'avatar utilisateur avec initiales colorées
  private generateUserAvatarUrl(text: string): string {
    const colors = [
      '#667eea', '#764ba2', '#f093fb', '#f5576c', 
      '#4facfe', '#00f2fe', '#43e97b', '#38f9d7'
    ];
    
    const colorIndex = text.charCodeAt(0) % colors.length;
    const backgroundColor = colors[colorIndex];
    
    // Génère une image SVG en base64 pour l'avatar utilisateur (plus petit)
    const svg = `
      <svg width="32" height="32" xmlns="http://www.w3.org/2000/svg">
        <rect width="32" height="32" fill="${backgroundColor}"/>
        <text x="16" y="20" font-family="Arial, sans-serif" font-size="12" 
              font-weight="bold" text-anchor="middle" fill="white">${text}</text>
      </svg>
    `;
    
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }

  // Gère les erreurs de chargement d'avatar utilisateur
  onUserAvatarError(event: any, username: string): void {
    event.target.src = this.getDefaultUserAvatar(username);
    event.target.onerror = null;
  }

  // Actions footer
  openAbout(): void {
    this.showAboutModal = true;
  }

  openPrivacy(): void {
    this.showPrivacyModal = true;
  }

  openContact(): void {
    this.showContactModal = true;
  }

  // Fermer les modals
  closeAboutModal(): void {
    this.showAboutModal = false;
  }

  closePrivacyModal(): void {
    this.showPrivacyModal = false;
  }

  closeContactModal(): void {
    this.showContactModal = false;
  }

  // Ouvrir le profil utilisateur
  openUserProfile(): void {
    if (this.userProfile) {
      this.userProfile.openProfile();
    }
  }

  // Ouvrir les quêtes
  openQuests(): void {
    if (this.questsComponent) {
      this.questsComponent.openQuests();
    }
    this.closeMobileMenu(); // Fermer le menu mobile après action
  }
  
  // Gestion du menu burger mobile
  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }
  
  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
  }
}
