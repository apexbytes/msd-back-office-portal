import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class LoadingService {
  private _loadingCount = 0;
  private _isLoading = signal<boolean>(false);
  isLoading = this._isLoading.asReadonly();

  show(): void {
    this._loadingCount++;
    this._updateState();
  }

  hide(): void {
    this._loadingCount = Math.max(0, this._loadingCount - 1);
    this._updateState();
  }

  private _updateState(): void {
    this._isLoading.set(this._loadingCount > 0);
  }
}
