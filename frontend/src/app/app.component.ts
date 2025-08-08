import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';

import { AuthService, User } from './services/auth.service';
import { FavoriteService } from './services/favorite.service';
import { QuestsComponent } from './components/quests/quests.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, QuestsComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'Streamyscovery';
  
  // États de l'authentification
  isAuthenticated = false;
  user: User | null = null;
  favoriteCount = 0;
  
  // État du modal des quêtes
  isQuestsModalOpen = false;

  private destroy$ = new Subject<void>();

  // Injection des services avec le nouveau système
  private authService = inject(AuthService);
  private favoriteService = inject(FavoriteService);

  ngOnInit(): void {
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
    // TODO: Implémenter modal À propos
    console.log('À propos clicked');
  }

  openPrivacy(): void {
    // TODO: Implémenter modal Confidentialité  
    console.log('Confidentialité clicked');
  }

  openContact(): void {
    // TODO: Implémenter modal Contact
    console.log('Contact clicked');
  }

  // Gestion du modal des quêtes
  openQuestsModal(): void {
    this.isQuestsModalOpen = true;
  }

  closeQuestsModal(): void {
    this.isQuestsModalOpen = false;
  }
}
