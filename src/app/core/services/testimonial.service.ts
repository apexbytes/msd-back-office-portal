import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@/environments/environment';
import { Testimonial } from '../models/testimonial.model';
import { ApiResponse } from '../dtos/responses/base.response';
import { PaginationParams, SortParams } from '../dtos/requests/pagination.request';
import { AdminStatusUpdateRequest } from '../dtos/requests/admin.request';

export type QueryParams = PaginationParams & SortParams;

@Injectable({
  providedIn: 'root',
})
export class TestimonialService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}testimonials`;

  private buildParams(params?: QueryParams): HttpParams {
    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          httpParams = httpParams.set(key, value.toString());
        }
      });
    }
    return httpParams;
  }

  // --- Admin Endpoints ---

  /**
   * Admin endpoint to view all testimonials in the system (published, pending, rejected).
   */
  getAllTestimonialsInSystem(params?: QueryParams): Observable<ApiResponse<Testimonial[]>> {
    return this.http.get<ApiResponse<Testimonial[]>>(`${this.apiUrl}/admin/all`, {
      params: this.buildParams(params),
    });
  }

  /**
   * Admin endpoint to approve, reject, or update the general status of a testimonial.
   */
  adminManageTestimonial(
    id: string,
    payload: AdminStatusUpdateRequest,
  ): Observable<ApiResponse<Testimonial>> {
    return this.http.patch<ApiResponse<Testimonial>>(`${this.apiUrl}/admin/${id}/manage`, payload);
  }

  /**
   * Admin endpoint specifically to toggle the featured status of a testimonial.
   */
  toggleFeaturedTestimonial(id: string, featured: boolean): Observable<ApiResponse<Testimonial>> {
    return this.http.patch<ApiResponse<Testimonial>>(`${this.apiUrl}/admin/${id}/featured`, {
      featured,
    });
  }

  // --- Public / Shared Endpoints ---

  /**
   * Public endpoint to get only the approved/published testimonials for the frontend.
   */
  getPublishedTestimonials(params?: QueryParams): Observable<ApiResponse<Testimonial[]>> {
    return this.http.get<ApiResponse<Testimonial[]>>(`${this.apiUrl}/published`, {
      params: this.buildParams(params),
    });
  }

  getTestimonialById(id: string): Observable<ApiResponse<Testimonial>> {
    return this.http.get<ApiResponse<Testimonial>>(`${this.apiUrl}/${id}`);
  }

  createTestimonial(testimonialData: Partial<Testimonial>): Observable<ApiResponse<Testimonial>> {
    return this.http.post<ApiResponse<Testimonial>>(this.apiUrl, testimonialData);
  }

  updateTestimonial(
    id: string,
    testimonialData: Partial<Testimonial>,
  ): Observable<ApiResponse<Testimonial>> {
    return this.http.put<ApiResponse<Testimonial>>(`${this.apiUrl}/${id}`, testimonialData);
  }

  deleteTestimonial(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }
}
