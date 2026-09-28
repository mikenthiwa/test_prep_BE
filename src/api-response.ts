export type ApiResponse<T = unknown> = {
  success: boolean;
  status: number;
  message: string;
  data?: T;
  error?: Record<string, unknown>;
};

export function apiResponse<T = unknown>(
  response: ApiResponse<T>
): ApiResponse<T> {
  return {
    success: response.success,
    status: response.status,
    message: response.message,
    ...('data' in response ? { data: response.data } : {}),
    ...('error' in response ? { error: response.error } : {}),
  };
}
