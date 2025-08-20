import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-subscription-success',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="success-container">
      <div class="success-card">
        <div class="success-icon">
          <span>🎉</span>
        </div>
        
        <h1>Paiement réussi !</h1>
        <p class="success-message">
          Félicitations ! Votre abonnement a été activé avec succès.
        </p>
        
        <div class="subscription-details" *ngIf="sessionId">
          <h3>Détails de votre abonnement :</h3>
          <p><strong>Session ID :</strong> {{ sessionId }}</p>
          <p><strong>Status :</strong> <span class="status-active">Actif</span></p>
        </div>
        
        <div class="next-steps">
          <h3>Prochaines étapes :</h3>
          <ul>
            <li>✅ Votre abonnement premium est maintenant actif</li>
            <li>🎮 Vous avez accès aux quêtes premium exclusives</li>
            <li>⚡ Votre boost XP premium est activé</li>
            <li>🎨 Les thèmes cosmétiques sont débloqués</li>
          </ul>
        </div>
        
        <div class="action-buttons">
          <button class="btn-primary" (click)="goToProfile()">
            Voir mon profil
          </button>
          <button class="btn-secondary" (click)="goToHome()">
            Retour à l'accueil
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .success-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }
    
    .success-card {
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(15px);
      border-radius: 20px;
      padding: 40px;
      text-align: center;
      max-width: 600px;
      box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.3);
    }
    
    .success-icon span {
      font-size: 80px;
      margin-bottom: 20px;
      display: block;
    }
    
    h1 {
      color: #fff;
      font-size: 2.5rem;
      margin-bottom: 15px;
      font-weight: bold;
    }
    
    .success-message {
      color: rgba(255, 255, 255, 0.9);
      font-size: 1.2rem;
      margin-bottom: 30px;
    }
    
    .subscription-details, .next-steps {
      background: rgba(255, 255, 255, 0.05);
      border-radius: 10px;
      padding: 20px;
      margin: 20px 0;
      text-align: left;
    }
    
    .subscription-details h3, .next-steps h3 {
      color: #fff;
      margin-bottom: 15px;
      font-size: 1.3rem;
    }
    
    .subscription-details p {
      color: rgba(255, 255, 255, 0.8);
      margin: 8px 0;
    }
    
    .status-active {
      color: #4ade80;
      font-weight: bold;
    }
    
    .next-steps ul {
      list-style: none;
      padding: 0;
    }
    
    .next-steps li {
      color: rgba(255, 255, 255, 0.8);
      margin: 10px 0;
      padding-left: 10px;
    }
    
    .action-buttons {
      display: flex;
      gap: 15px;
      justify-content: center;
      margin-top: 30px;
    }
    
    .btn-primary, .btn-secondary {
      padding: 12px 30px;
      border-radius: 25px;
      border: none;
      font-weight: bold;
      cursor: pointer;
      transition: all 0.3s ease;
      font-size: 16px;
    }
    
    .btn-primary {
      background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
      color: white;
    }
    
    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
    }
    
    .btn-secondary {
      background: rgba(255, 255, 255, 0.2);
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.3);
    }
    
    .btn-secondary:hover {
      background: rgba(255, 255, 255, 0.3);
    }
    
    @media (max-width: 768px) {
      .success-card {
        padding: 20px;
        margin: 10px;
      }
      
      .action-buttons {
        flex-direction: column;
      }
      
      h1 {
        font-size: 2rem;
      }
    }
  `]
})
export class SubscriptionSuccessComponent implements OnInit {
  sessionId: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    // Récupérer le session_id depuis l'URL
    this.sessionId = this.route.snapshot.queryParams['session_id'];
    console.log('✅ Page de succès - Session ID:', this.sessionId);
    
    // TODO: Valider la session côté backend et mettre à jour l'abonnement utilisateur
    if (this.sessionId) {
      this.validatePayment(this.sessionId);
    }
  }

  private validatePayment(sessionId: string) {
    // TODO: Appeler le backend pour valider la session et activer l'abonnement
    console.log('🔄 Validation du paiement en cours...');
  }

  goToProfile() {
    this.router.navigate(['/profile']);
  }

  goToHome() {
    this.router.navigate(['/']);
  }
}
