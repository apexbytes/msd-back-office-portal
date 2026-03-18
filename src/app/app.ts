import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SpinnerUi } from './views/shared/spinner/spinner.ui';

@Component({
  selector: 'app-root',

  imports: [RouterOutlet, SpinnerUi],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('back-office-portal-msd');
}
