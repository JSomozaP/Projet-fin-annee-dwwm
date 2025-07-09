import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { StreamViewerComponent } from './components/stream-viewer/stream-viewer.component';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, StreamViewerComponent, HttpClientModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'twitchscovery';
}
  