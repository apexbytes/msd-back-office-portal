export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  pagination?: PaginationMetadata;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface PaginationMetadata {
  currentPage?: number;
  totalPages?: number;
  totalCount?: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
  nextCursor?: string;
}
