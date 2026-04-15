import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { catchError, Observable, retry, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable()
export class HttpErrorInterceptor implements HttpInterceptor {

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(request).pipe(
      retry(1), // Retry failed request once
      catchError((error: HttpErrorResponse) => {
        let errorMessage = '';

        if (error.error instanceof ErrorEvent) {
          // Client-side error
          errorMessage = `Client Error: ${error.error.message}`;
          console.error('Client-side error:', error.error.message);
        } else {
          // Server-side error
          errorMessage = this.getServerErrorMessage(error);
          console.error(`Server Error: ${error.status} - ${error.message}`);
          
          // Handle specific HTTP status codes
          this.handleHttpError(error);
        }

        // Return error observable with user-friendly message
        return throwError(() => ({
          status: error.status,
          message: errorMessage,
          error: error.error
        }));
      })
    );
  }

  /**
   * Get user-friendly error message based on HTTP status code
   */
  private getServerErrorMessage(error: HttpErrorResponse): string {
    switch (error.status) {
      case 0:
        return 'Unable to connect to the server. Please check your internet connection.';
      
      case 400:
        return error.error?.message || 'Bad Request. Please check your input.';
      
      case 401:
        return 'Unauthorized. Please log in again.';
      
      case 403:
        return 'Access Forbidden. You do not have permission to perform this action.';
      
      case 404:
        return error.error?.message || 'The requested resource was not found.';
      
      case 409:
        return error.error?.message || 'Conflict. The resource already exists.';
      
      case 422:
        return error.error?.message || 'Validation failed. Please check your input.';
      
      case 500:
        return 'Internal Server Error. Please try again later.';
      
      case 502:
        return 'Bad Gateway. The server is temporarily unavailable.';
      
      case 503:
        return 'Service Unavailable. Please try again later.';
      
      case 504:
        return 'Gateway Timeout. The request took too long to complete.';
      
      default:
        return error.error?.message || `Error: ${error.status} - ${error.statusText}`;
    }
  }

  /**
   * Handle specific HTTP error status codes with appropriate actions
   */
  private handleHttpError(error: HttpErrorResponse): void {
    switch (error.status) {
      case 401:
        // Unauthorized - redirect to login
        console.warn('Unauthorized access - redirecting to login');
        this.authService.logout();
        this.router.navigate(['/auth/login'], {
          queryParams: { returnUrl: this.router.url }
        });
        break;
      
      case 403:
        // Forbidden - redirect to access denied page or dashboard
        console.warn('Access forbidden');
        this.router.navigate(['/dashboard']);
        break;
      
      case 404:
        // Not found - could redirect to 404 page
        console.warn('Resource not found:', error.url);
        break;
      
      case 500:
      case 502:
      case 503:
      case 504:
        // Server errors - could show a maintenance page or toast notification
        console.error('Server error occurred:', error.status);
        break;
    }
  }
}