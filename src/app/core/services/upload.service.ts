import { HttpClient, HttpEvent, HttpEventType, HttpRequest } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, filter, map } from 'rxjs';
import { environment } from '@/environments/environment';
import { TempUploadResponse } from '../dtos/responses/upload.response';

@Injectable({
  providedIn: 'root',
})
export class UploadService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}uploads`;

  readonly isUploading = signal<boolean>(false);

  readonly uploadProgress = signal<number>(0);

  /**
   * Upload files to the temporary storage endpoint.
   * Returns an array of public_ids and URLs.
   *
   * @param files Single File or Array of File objects to upload (max 10)
   * @returns Observable of TempUploadResponse
   */
  uploadTemp(files: File | File[]): Observable<TempUploadResponse> {
    const formData = new FormData();
    const fileArray = Array.isArray(files) ? files : [files];

    fileArray.forEach((file) => {
      formData.append('images', file);
    });

    return this.http.post<TempUploadResponse>(`${this.apiUrl}/temp`, formData);
  }

  /**
   * Upload files to the temporary storage endpoint with progress tracking.
   * Updates `uploadProgress` and `isUploading` signals.
   *
   * @param files Single File or Array of File objects to upload
   * @returns Observable of TempUploadResponse once completed
   */
  uploadTempWithProgress(files: File | File[]): Observable<TempUploadResponse> {
    this.isUploading.set(true);
    this.uploadProgress.set(0);

    const formData = new FormData();
    const fileArray = Array.isArray(files) ? files : [files];

    fileArray.forEach((file) => {
      formData.append('images', file);
    });

    const req = new HttpRequest('POST', `${this.apiUrl}/temp`, formData, {
      reportProgress: true,
    });

    return this.http.request<TempUploadResponse>(req).pipe(
      map((event: HttpEvent<TempUploadResponse>) => {
        switch (event.type) {
          case HttpEventType.UploadProgress:
            if (event.total) {
              const progress = Math.round((100 * event.loaded) / event.total);
              this.uploadProgress.set(progress);
            }
            break;
          case HttpEventType.Response:
            this.isUploading.set(false);
            this.uploadProgress.set(100);
            return event.body as TempUploadResponse;
        }
        return null;
      }),
      filter((response): response is TempUploadResponse => response !== null)
    );
  }

  /**
   * Resets the upload progress signals.
   */
  resetProgress(): void {
    this.isUploading.set(false);
    this.uploadProgress.set(0);
  }
}
