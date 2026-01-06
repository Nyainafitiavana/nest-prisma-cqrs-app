export interface ExecuteResponse<T = any> {
  success?: boolean;
  message: string;
  data?: T;
  statusCode: number;
}

export interface Paginate<T> {
  data: T;
  totalRows: number;
  page: number;
}
