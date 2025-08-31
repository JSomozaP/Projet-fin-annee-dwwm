import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-subscription-cancel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="cancel-container">
      <div class="cancel-card">
        <div class="cancel-icon">
          <span>💔</span>
        </div>
        
        <h1>Paiement annulé</h1>
        <p class="cancel-message">
          Aucun souci ! Votre paiement a été annulé et aucun montant n'a été débité.
        </p>
        
        <div class="help-section">
          <h3>Besoin d'aide ?</h3>
          <p>Si vous rencontrez des difficultés ou avez des questions :</p>
          <ul>
            <li>📧 Contactez notre support : <strong>support&#64;streamyscovery.com</strong></li>
            <li>💬 Rejoignez notre Discord pour obtenir de l'aide</li>
            <li>📞 Assistance technique disponible 7j/7</li>
          </ul>
        </div>
        
        <div class="alternatives">
          <h3>Vous pouvez toujours :</h3>
          <div class="alternative-options">
            <div class="option">
              <span class="option-icon">🆓</span>
              <h4>Continuer en gratuit</h4>
              <p>Profitez de toutes les fonctionnalités de base</p>
            </div>
            <div class="option">
              <span class="option-icon">💎</span>
              <h4>Réessayer plus tard</h4>
              <p>Vos plans premium vous attendent</p>
            </div>
          </div>
        </div>
        
        <div class="action-buttons">
          <button class="btn-primary" (click)="goToSubscription()">
            Voir les abonnements
          </button>
          <button class="btn-secondary" (click)="goToHome()">
            Retour à l'accueil
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .cancel-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }
    
    .cancel-card {
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(15px);
      border-radius: 20px;
      padding: 40px;
      text-align: center;
      max-width: 700px;
      box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.3);
    }
    
    .cancel-icon span {
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
    
    .cancel-message {
      color: rgba(255, 255, 255, 0.9);
      font-size: 1.2rem;
      margin-bottom: 30px;
    }
    
    .help-section, .alternatives {
      background: rgba(255, 255, 255, 0.05);
      border-radius: 10px;
      padding: 20px;
      margin: 20px 0;
      text-align: left;
    }
    
    .help-section h3, .alternatives h3 {
      color: #fff;
      margin-bottom: 15px;
      font-size: 1.3rem;
      text-align: center;
    }
    
    .help-section p {
      color: rgba(255, 255, 255, 0.8);
      margin-bottom: 15px;
    }
    
    .help-section ul {
      list-style: none;
      padding: 0;
    }
    
    .help-section li {
      color: rgba(255, 255, 255, 0.8);
      margin: 10px 0;
      padding-left: 10px;
    }
    
    .alternative-options {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 20px;
      margin-top: 20px;
    }
    
    .option {
      background: rgba(255, 255, 255, 0.05);
      border-radius: 10px;
      padding: 20px;
      text-align: center;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .option-icon {
      font-size: 40px;
      display: block;
      margin-bottom: 10px;
    }
    
    .option h4 {
      color: #fff;
      margin: 10px 0;
      font-size: 1.1rem;
    }
    
    .option p {
      color: rgba(255, 255, 255, 0.7);
      font-size: 0.9rem;
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
      .cancel-card {
        padding: 20px;
        margin: 10px;
      }
      
      .action-buttons {
        flex-direction: column;
      }
      
      .alternative-options {
        grid-template-columns: 1fr;
      }
      
      h1 {
        font-size: 2rem;
      }
    }
  `]
})
export class SubscriptionCancelComponent {

  constructor(private router: Router) {}

  goToSubscription() {
    this.router.navigate(['/subscription']);
  }

  goToHome() {
    this.router.navigate(['/']);
  }
}
