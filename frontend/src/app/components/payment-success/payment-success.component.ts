import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { StripeService } from '../../services/stripe.service';

@Component({
  selector: 'app-payment-success',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="success-container">
      <div class="success-card">
        <div class="success-icon">
          <div class="checkmark">✓</div>
        </div>
        
        <h1>Paiement réussi !</h1>
        <p class="success-message">
          Félicitations ! Votre abonnement <strong>{{planName}}</strong> a été activé avec succès.
        </p>
        
        <div class="session-info" *ngIf="sessionId">
          <p><strong>ID de session :</strong> {{sessionId}}</p>
        </div>
        
        <div class="next-steps">
          <h3>Prochaines étapes :</h3>
          <ul>
            <li>✅ Votre abonnement est maintenant actif</li>
            <li>🎮 Profitez de vos nouvelles fonctionnalités premium</li>
            <li>🏆 Débloquez des quêtes exclusives</li>
            <li>⚡ Bénéficiez de votre boost XP</li>
          </ul>
        </div>
        
        <div class="action-buttons">
          <button class="btn-primary" (click)="goToDiscovery()">
            🎯 Commencer l'exploration
          </button>
          <button class="btn-secondary" (click)="goToProfile()">
            👤 Voir mon profil
          </button>
        </div>
        
        <div class="loading" *ngIf="loading">
          <p>⏳ Activation de votre abonnement en cours...</p>
        </div>
        
        <div class="error" *ngIf="error">
          <p>⚠️ {{error}}</p>
          <button class="btn-retry" (click)="retryActivation()">Réessayer</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .success-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }
    
    .success-card {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      border-radius: 20px;
      padding: 40px;
      max-width: 500px;
      width: 100%;
      text-align: center;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
    }
    
    .success-icon {
      margin-bottom: 30px;
    }
    
    .checkmark {
      display: inline-block;
      width: 80px;
      height: 80px;
      background: linear-gradient(45deg, #56ab2f, #a8e6cf);
      border-radius: 50%;
      color: white;
      font-size: 40px;
      line-height: 80px;
      animation: bounce 0.6s ease;
    }
    
    @keyframes bounce {
      0%, 20%, 60%, 100% { transform: translateY(0); }
      40% { transform: translateY(-20px); }
      80% { transform: translateY(-10px); }
    }
    
    h1 {
      color: #2c3e50;
      margin-bottom: 20px;
      font-size: 28px;
    }
    
    .success-message {
      color: #34495e;
      font-size: 16px;
      margin-bottom: 25px;
    }
    
    .session-info {
      background: #f8f9fa;
      padding: 15px;
      border-radius: 10px;
      margin-bottom: 25px;
      font-family: monospace;
      font-size: 12px;
      color: #6c757d;
    }
    
    .next-steps {
      background: #e8f5e8;
      padding: 20px;
      border-radius: 10px;
      margin-bottom: 25px;
      text-align: left;
    }
    
    .next-steps h3 {
      color: #27ae60;
      margin-bottom: 15px;
    }
    
    .next-steps ul {
      margin: 0;
      padding-left: 20px;
    }
    
    .next-steps li {
      margin-bottom: 8px;
      color: #2c3e50;
    }
    
    .action-buttons {
      display: flex;
      gap: 15px;
      justify-content: center;
      flex-wrap: wrap;
    }
    
    .btn-primary, .btn-secondary {
      padding: 12px 24px;
      border: none;
      border-radius: 10px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      font-size: 14px;
    }
    
    .btn-primary {
      background: linear-gradient(45deg, #667eea, #764ba2);
      color: white;
    }
    
    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
    }
    
    .btn-secondary {
      background: white;
      color: #667eea;
      border: 2px solid #667eea;
    }
    
    .btn-secondary:hover {
      background: #667eea;
      color: white;
    }
    
    .loading, .error {
      margin-top: 20px;
      padding: 15px;
      border-radius: 10px;
    }
    
    .loading {
      background: #fff3cd;
      color: #856404;
    }
    
    .error {
      background: #f8d7da;
      color: #721c24;
    }
    
    .btn-retry {
      background: #dc3545;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 5px;
      cursor: pointer;
      margin-top: 10px;
    }
    
    @media (max-width: 768px) {
      .success-card {
        padding: 30px 20px;
      }
      
      .action-buttons {
        flex-direction: column;
      }
      
      .btn-primary, .btn-secondary {
        width: 100%;
      }
    }
  `]
})
export class PaymentSuccessComponent implements OnInit {
  sessionId: string | null = null;
  planName: string = 'Premium';
  loading = false;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private stripeService: StripeService
  ) {}

  ngOnInit() {
    // Récupérer l'ID de session depuis l'URL
    this.sessionId = this.route.snapshot.queryParams['session_id'];
    
    if (this.sessionId) {
      this.confirmPayment();
    }
  }

  private async confirmPayment() {
    this.loading = true;
    this.error = null;

    try {
      // Ici vous pourriez appeler votre backend pour confirmer le paiement
      // et mettre à jour le statut de l'utilisateur
      console.log('✅ Confirmation du paiement pour session:', this.sessionId);
      
      // Simuler un délai de traitement
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mettre à jour le localStorage avec le nouveau plan
      localStorage.setItem('userSubscriptionTier', 'premium');
      
      this.loading = false;
    } catch (error) {
      console.error('❌ Erreur confirmation paiement:', error);
      this.error = 'Erreur lors de la confirmation du paiement';
      this.loading = false;
    }
  }

  retryActivation() {
    this.confirmPayment();
  }

  goToDiscovery() {
    this.router.navigate(['/discovery']);
  }

  goToProfile() {
    this.router.navigate(['/subscription']);
  }
}
