export interface PaginatedResponse<T> {
  data: {
    data: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
  message?: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}
