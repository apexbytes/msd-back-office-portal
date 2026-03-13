export interface PaginationParams {
  limit?: number;
  page?: number;
  cursor?: string;
  search?: string;
  status?: string;
}

export interface SortParams {
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}
