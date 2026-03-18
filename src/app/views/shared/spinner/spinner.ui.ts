import { Component, inject } from '@angular/core';
import { LoadingService } from '../../../core/services/loading.service';

@Component({
  selector: 'app-spinner',

  imports: [],
  templateUrl: './spinner.ui.html',
  styleUrl: './spinner.ui.css',
})
export class SpinnerUi {
  private loadingService = inject(LoadingService);
  isLoading = this.loadingService.isLoading;
}
