import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SecurityContext, inject } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-stream-viewer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="stream-viewer" *ngIf="streamerName">
      <div class="stream-container">
        <!-- Stream embed -->
        <div class="stream-embed">
          <iframe 
            [src]="streamEmbedUrl"
            frameborder="0"
            allowfullscreen
            scrolling="no">
          </iframe>
        </div>
        
        <!-- Chat embed -->
        <div class="chat-embed">
          <iframe 
            [src]="chatEmbedUrl"
            frameborder="0"
            scrolling="no">
          </iframe>
        </div>
      </div>
      
      <!-- Controls -->
      <div class="stream-controls">
        <button class="btn btn-secondary" (click)="onCloseViewer()">
          ← Retour à la découverte
        </button>
        <a [href]="twitchUrl" target="_blank" class="btn btn-outline">
          Ouvrir sur Twitch ↗
        </a>
      </div>
    </div>
  `,
  styles: [`
    .stream-viewer {
      position: fixed; /* Position fixe pour sortir du flux normal */
      top: 70px; /* Juste en dessous de la navbar */
      left: 0;
      right: 0;
      bottom: 0; /* Prend toute la hauteur restante */
      background: var(--bg-primary);
      z-index: 999;
      padding: var(--spacing-md);
      overflow: auto;
    }

    .stream-container {
      display: flex;
      gap: 0;
      margin: 0 auto;
      border-radius: var(--radius-lg);
      overflow: hidden;
      box-shadow: var(--shadow-lg);
      width: calc(100vw - 32px); /* Largeur maximale moins padding */
      height: calc(100vh - 70px - 64px - 60px); /* Hauteur max moins navbar, padding et contrôles */
      max-width: 1800px; /* Limite raisonnable pour très grands écrans */
    }

    .stream-embed {
      flex: 3; /* 75% de l'espace pour le stream */
      background: #000;
      position: relative;
    }

    .stream-embed iframe {
      width: 100%;
      height: 100%; /* Prend toute la hauteur du conteneur */
      border: none;
      display: block;
    }

    .chat-embed {
      flex: 1; /* 25% de l'espace pour le chat */
      background: var(--bg-secondary);
      border-left: 1px solid var(--border-color);
      position: relative;
    }

    .chat-embed iframe {
      width: 100%;
      height: 100%; /* Prend toute la hauteur du conteneur */
      border: none;
      display: block;
    }

    .stream-controls {
      display: flex;
      gap: var(--spacing-md);
      justify-content: center;
      margin-top: var(--spacing-md);
      padding: var(--spacing-md);
      background: rgba(0, 0, 0, 0.1);
      border-radius: var(--radius-md);
    }

    @media (max-width: 1200px) {
      .stream-viewer {
        position: static; /* Retour en position normale sur mobile */
        padding: var(--spacing-sm);
      }
      
      .stream-container {
        flex-direction: column;
        height: auto;
        width: 100%;
        max-width: none;
      }
      
      .stream-embed {
        flex: none;
      }
      
      .chat-embed {
        flex: none;
        border-left: none;
        border-top: 1px solid var(--border-color);
        height: 400px; /* Hauteur fixe pour le chat sur mobile */
      }
      
      .chat-embed iframe {
        height: 400px;
      }
      
      .stream-embed iframe {
        height: 450px; /* Hauteur pour le stream sur mobile */
      }
    }
  `]
})
export class StreamViewerComponent implements OnInit, OnChanges {
  @Input() streamerName: string = '';
  @Output() closeViewer = new EventEmitter<void>();
  
  streamEmbedUrl: SafeResourceUrl | null = null;
  chatEmbedUrl: SafeResourceUrl | null = null;
  twitchUrl: string = '';

  private sanitizer = inject(DomSanitizer);

  ngOnInit(): void {
    if (this.streamerName) {
      this.setupUrls();
    }
  }

  ngOnChanges(): void {
    if (this.streamerName) {
      this.setupUrls();
    }
  }

  private setupUrls(): void {
    const streamUrl = `https://player.twitch.tv/?channel=${this.streamerName}&parent=localhost&autoplay=true`;
    const chatUrl = `https://www.twitch.tv/embed/${this.streamerName}/chat?parent=localhost`;
    
    this.streamEmbedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(streamUrl);
    this.chatEmbedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(chatUrl);
    this.twitchUrl = `https://www.twitch.tv/${this.streamerName}`;
  }

  onCloseViewer(): void {
    this.closeViewer.emit();
  }
}
