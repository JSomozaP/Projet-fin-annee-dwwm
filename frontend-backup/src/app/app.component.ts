import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';

import { AuthService, User } from './services/auth.service';
import { FavoriteService } from './services/favorite.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'Streamyscovery';
  
  // États de l'authentification
  isAuthenticated = false;
  user: User | null = null;
  favoriteCount = 0;

  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private favoriteService: FavoriteService
  ) {}

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
}
  