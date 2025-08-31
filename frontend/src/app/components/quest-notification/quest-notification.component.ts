import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { UserProgressionService } from '../../services/user-progression.service';

interface QuestNotification {
  id: string;
  questTitle: string;
  questDescription: string;
  reward: string;
  type: 'quest_completed' | 'achievement_unlocked' | 'level_up';
  timestamp: Date;
}

@Component({
  selector: 'app-quest-notification',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Notification Toast -->
    <div *ngIf="currentNotification" 
         class="quest-notification-toast"
         [class.visible]="isVisible">
      <div class="notification-content">
        <div class="notification-icon">
          {{ getNotificationIcon(currentNotification.type) }}
        </div>
        <div class="notification-text">
          <h4>{{ currentNotification.questTitle }}</h4>
          <p>{{ currentNotification.questDescription }}</p>
          <span class="reward">{{ currentNotification.reward }}</span>
        </div>
        <button class="close-btn" (click)="dismissNotification()">
          ✕
        </button>
      </div>
    </div>
  `,
  styles: [`
    .quest-notification-toast {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 1000;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      color: white;
      min-width: 320px;
      max-width: 400px;
      transform: translateX(100%);
      opacity: 0;
      transition: all 0.3s ease-out;
    }

    .quest-notification-toast.visible {
      transform: translateX(0);
      opacity: 1;
    }

    .notification-content {
      display: flex;
      align-items: flex-start;
      padding: 16px;
      gap: 12px;
    }

    .notification-icon {
      font-size: 24px;
      flex-shrink: 0;
    }

    .notification-text {
      flex: 1;
    }

    .notification-text h4 {
      margin: 0 0 4px 0;
      font-size: 16px;
      font-weight: 600;
    }

    .notification-text p {
      margin: 0 0 8px 0;
      font-size: 14px;
      opacity: 0.9;
    }

    .reward {
      display: inline-block;
      background: rgba(255, 255, 255, 0.2);
      padding: 4px 8px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
    }

    .close-btn {
      background: none;
      border: none;
      color: white;
      font-size: 18px;
      cursor: pointer;
      opacity: 0.7;
      transition: opacity 0.2s;
      flex-shrink: 0;
    }

    .close-btn:hover {
      opacity: 1;
    }

    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    /* Notification différente pour achievements */
    .quest-notification-toast.achievement {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    }

    .quest-notification-toast.level-up {
      background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    }
  `]
})
export class QuestNotificationComponent implements OnInit, OnDestroy {
  currentNotification: QuestNotification | null = null;
  isVisible = false;
  private subscription: Subscription = new Subscription();
  private hideTimeout: any = null;

  constructor(private userProgressionService: UserProgressionService) {}

  ngOnInit() {
    // S'abonner aux notifications de quêtes
    this.subscription.add(
      this.userProgressionService.questNotifications$.subscribe(
        notification => {
          if (notification) {
            this.showNotification(notification);
          } else {
            this.hideNotification();
          }
        }
      )
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
    }
  }

  private showNotification(notification: QuestNotification) {
    // Nettoyer le timeout précédent si il existe
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
    }

    // Définir la notification
    this.currentNotification = notification;
    
    // Délai pour permettre à Angular de rendre le DOM
    setTimeout(() => {
      this.isVisible = true;
    }, 50);

    // Auto-masquer après 8 secondes (plus de temps pour lire)
    this.hideTimeout = setTimeout(() => {
      this.hideNotification();
    }, 8000);
  }

  private hideNotification() {
    this.isVisible = false;
    
    // Attendre la fin de l'animation avant de supprimer
    setTimeout(() => {
      this.currentNotification = null;
    }, 300);
  }

  getNotificationIcon(type: string): string {
    switch (type) {
      case 'quest_completed':
        return '🎯';
      case 'achievement_unlocked':
        return '🏆';
      case 'level_up':
        return '⬆️';
      default:
        return '✨';
    }
  }

  dismissNotification() {
    this.hideNotification();
  }
}
