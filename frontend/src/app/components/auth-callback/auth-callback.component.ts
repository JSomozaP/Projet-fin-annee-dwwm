/**
 * Streamyscovery - Composant de callback d'authentification
 * Copyright (c) 2025 Jeremy Somoza. Tous droits réservés.
 * 
 * Ce composant gère le retour de l'authentification OAuth Twitch
 * et la redirection vers l'application après connexion.
 * 
 * @author Jeremy Somoza
 * @project Streamyscovery
 * @date 2025
 */

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-auth-callback',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="auth-callback-container">
      <div class="auth-callback-content">
        <div *ngIf="isLoading" class="loading-state">
          <div class="spinner"></div>
          <h2>Connexion en cours...</h2>
          <p>Vérification de votre authentification Twitch</p>
        </div>

        <div *ngIf="isSuccess" class="success-state">
          <div class="success-icon">✅</div>
          <h2>Connexion réussie !</h2>
          <p>Bienvenue {{ username }} ! Redirection vers l'application...</p>
        </div>

        <div *ngIf="isError" class="error-state">
          <div class="error-icon">❌</div>
          <h2>Erreur de connexion</h2>
          <p>{{ errorMessage }}</p>
          <button class="btn btn-primary" (click)="retryAuth()">
            Réessayer
          </button>
          <button class="btn btn-secondary" (click)="goToHome()">
            Retour à l'accueil
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-callback-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 2rem;
    }

    .auth-callback-content {
      background: rgba(255, 255, 255, 0.95);
      border-radius: 1rem;
      padding: 3rem;
      text-align: center;
      max-width: 500px;
      width: 100%;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
    }

    .loading-state, .success-state, .error-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
    }

    .spinner {
      width: 50px;
      height: 50px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #667eea;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .success-icon, .error-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
    }

    h2 {
      color: #333;
      margin: 0;
      font-size: 1.8rem;
    }

    p {
      color: #666;
      margin: 0.5rem 0;
      font-size: 1.1rem;
    }

    .btn {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 0.5rem;
      font-weight: 600;
      cursor: pointer;
      margin: 0.5rem;
      transition: all 0.3s ease;
    }

    .btn-primary {
      background: #667eea;
      color: white;
    }

    .btn-primary:hover {
      background: #5a6fd8;
      transform: translateY(-2px);
    }

    .btn-secondary {
      background: #6c757d;
      color: white;
    }

    .btn-secondary:hover {
      background: #5a6268;
      transform: translateY(-2px);
    }
  `]
})
export class AuthCallbackComponent implements OnInit {
  isLoading = true;
  isSuccess = false;
  isError = false;
  errorMessage = '';
  username = '';

  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (this.route.snapshot.url[1]?.path === 'success') {
        this.handleSuccessCallback(params['token']);
      } else if (this.route.snapshot.url[1]?.path === 'error') {
        this.handleErrorCallback(params['message']);
      }
    });
  }

  private handleSuccessCallback(token: string): void {
    if (token) {
      console.log('✅ Received auth token:', token);
      
      // Stocker le token
      localStorage.setItem('token', token);
      
      // Récupérer les infos utilisateur
      this.authService.getCurrentUser().subscribe({
        next: (user) => {
          console.log('👤 User authenticated:', user);
          this.username = user.username;
          this.isLoading = false;
          this.isSuccess = true;
          
          // Redirection vers l'accueil après 2 secondes
          setTimeout(() => {
            this.router.navigate(['/discovery']);
          }, 2000);
        },
        error: (error) => {
          console.error('❌ Error getting user info:', error);
          this.showError('Erreur lors de la récupération des informations utilisateur');
        }
      });
    } else {
      this.showError('Token d\'authentification manquant');
    }
  }

  private handleErrorCallback(message: string): void {
    console.error('❌ Auth error:', message);
    this.showError(message || 'Erreur d\'authentification inconnue');
  }

  private showError(message: string): void {
    this.isLoading = false;
    this.isError = true;
    this.errorMessage = message;
  }

  retryAuth(): void {
    this.authService.redirectToTwitchAuth();
  }

  goToHome(): void {
    this.router.navigate(['/discovery']);
  }
}
