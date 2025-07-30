import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { StreamService, Stream, StreamFilters } from '../../services/stream.service';

@Component({
  selector: 'app-stream-viewer',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  template: `
    <div class="stream-viewer">
      <h2>Découverte de streamers</h2>
      
      <div class="controls">
        <button (click)="getRandomStream()" [disabled]="loading">
          {{ loading ? 'Recherche...' : 'Stream aléatoire' }}
        </button>
      </div>

      <div *ngIf="error" class="error">
        {{ error }}
      </div>

      <div *ngIf="currentStream" class="stream-info">
        <h3>{{ currentStream.streamerName }}</h3>
        <p><strong>Jeu:</strong> {{ currentStream.jeu }}</p>
        <p><strong>Titre:</strong> {{ currentStream.titre }}</p>
        <p><strong>Viewers:</strong> {{ currentStream.nbViewers }}</p>
        <p><strong>Langue:</strong> {{ currentStream.langue }}</p>
        
        <div class="stream-embed">
          <iframe 
            [src]="getEmbedUrl()"
            width="800" 
            height="450" 
            frameborder="0" 
            scrolling="no" 
            allowfullscreen="true">
          </iframe>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .stream-viewer {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }

    .controls {
      margin: 20px 0;
    }

    button {
      background-color: #9146ff;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 16px;
    }

    button:hover:not(:disabled) {
      background-color: #772ce8;
    }

    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .error {
      background-color: #ff4444;
      color: white;
      padding: 10px;
      border-radius: 6px;
      margin: 10px 0;
    }

    .stream-info {
      margin-top: 20px;
    }

    .stream-info h3 {
      color: #9146ff;
      margin-bottom: 10px;
    }

    .stream-info p {
      margin: 5px 0;
    }

    .stream-embed {
      margin-top: 20px;
    }

    iframe {
      max-width: 100%;
      height: auto;
    }
  `]
})
export class StreamViewerComponent implements OnInit {
  currentStream: Stream | null = null;
  loading = false;
  error: string | null = null;

  constructor(private streamService: StreamService) {}

  ngOnInit() {
    // Charger un stream par défaut
    this.getRandomStream();
  }

  getRandomStream() {
    this.loading = true;
    this.error = null;

    const filters: StreamFilters = {
      language: 'fr',
      minViewers: 1,
      maxViewers: 1000
    };

    this.streamService.getRandomStream(filters).subscribe({
      next: (response) => {
        if (response.success) {
          this.currentStream = response.data;
        } else {
          this.error = response.message || 'Erreur lors de la récupération du stream';
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Erreur de connexion avec l\'API';
        this.loading = false;
        console.error('Erreur API:', err);
      }
    });
  }

  getEmbedUrl(): string {
    if (!this.currentStream) return '';
    return this.currentStream.embedUrl || `https://player.twitch.tv/?channel=${this.currentStream.streamerName}&parent=localhost`;
  }
}
