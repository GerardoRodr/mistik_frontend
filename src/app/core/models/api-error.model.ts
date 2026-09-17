// Formato unificado de error devuelto por HttpExceptionFilter de NestJS
export interface ApiErrorResponse {
  statusCode: number;
  error?: string;
  message: string | string[];
  timestamp: string;
  path: string;
}
