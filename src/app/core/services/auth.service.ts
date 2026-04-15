import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { catchError, map } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { User, UserRole } from '../models/user';
import { ApiResponse } from '../models/api-response';
import { AuthResponse } from '../models/AuthResponse';
import { RegisterRequest, RegisterResponse } from '../models/RegisterRequest';


@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;
  
  private currentUserRole$ = new BehaviorSubject<string | null>(null);
  private currentCustomerId$ = new BehaviorSubject<string | null>(null);
  
  private apiUrl = 'http://localhost:8080/api/auth';

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    const storedUser = localStorage.getItem('currentUser');
    this.currentUserSubject = new BehaviorSubject<User | null>(
      storedUser ? JSON.parse(storedUser) : null
    );
    this.currentUser = this.currentUserSubject.asObservable();
    
    const role = localStorage.getItem('userRole');
    const customerId = localStorage.getItem('customerId');
    this.currentUserRole$.next(role);
    this.currentCustomerId$.next(customerId);
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Login method
   */
  login(username: string, password: string): Observable<AuthResponse> {
    const loginRequest = { 
      username: username, 
      password: password 
    };
    
    return this.http.post<ApiResponse<AuthResponse>>(`${this.apiUrl}/login`, loginRequest)
      .pipe(
        map(response => {
          if (response.success && response.data) {
            // Store token and user data
            this.storeUserData(response.data);
            
            console.log('------------------USER---',response.data);
            
            // Create User object
            const user: User = {
              id: response.data.id? response.data.id:0,
              username: response.data.username,
              email: response.data.email,
              // firstName: response.data.firstName,
              // lastName: response.data.lastName,
              role: this.mapStringToUserRole(response.data.role),
              isActive: true,
              createdDate: new Date().toISOString(),
              lastModified: new Date().toISOString()
            };
            
            localStorage.setItem('currentUser', JSON.stringify(user));
            this.currentUserSubject.next(user);
            this.currentUserRole$.next(response.data.role);
            
            return response.data;
          }
          throw new Error(response.message || 'Login failed');
        }),
        catchError(error => {
          console.error('Login error:', error);
          return throwError(() => new Error(
            error.error?.message || 'Invalid username or password'
          ));
        })
      );
  }

  /**
   * Register new customer
   */
  register(registerData: RegisterRequest): Observable<RegisterResponse> {
    return this.http.post<ApiResponse<RegisterResponse>>(`${this.apiUrl}/register`, registerData)
      .pipe(
        map(response => {
          if (response.success) {
            return response.data;
          }
          throw new Error(response.message || 'Registration failed');
        }),
        catchError(error => {
          console.error('Registration error:', error);
          return throwError(() => {
            if (error.error?.message) {
              return new Error(error.error.message);
            }
            return new Error('Registration failed. Please try again.');
          });
        })
      );
  }

  /**
   * Store user data in localStorage
   */
  private storeUserData(authResponse: AuthResponse): void {
    localStorage.setItem('token', authResponse.token);
    localStorage.setItem('userRole', authResponse.role);
    localStorage.setItem('username', authResponse.username);
    localStorage.setItem('email', authResponse.email);
    
    if (authResponse.customerId) {
      localStorage.setItem('customerId', authResponse.customerId);
      this.currentCustomerId$.next(authResponse.customerId);
    }
    
    if (authResponse.firstName) {
      localStorage.setItem('firstName', authResponse.firstName);
    }
    
    if (authResponse.lastName) {
      localStorage.setItem('lastName', authResponse.lastName);
    }
  }

  /**
   * Logout method
   */
  logout(): void {
    // Clear all stored data
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('username');
    localStorage.removeItem('email');
    localStorage.removeItem('customerId');
    localStorage.removeItem('firstName');
    localStorage.removeItem('lastName');
    
    // Clear subjects
    this.currentUserSubject.next(null);
    this.currentUserRole$.next(null);
    this.currentCustomerId$.next(null);
    
    // Navigate to login
    this.router.navigate(['/auth/login']);
  }

  /**
   * Check if user is logged in
   */
  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  /**
   * Get stored JWT token
   */
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  /**
   * Get user role
   */
  getUserRole(): string | null {
    return localStorage.getItem('userRole');
  }

  /**
   * Get customer ID
   */
  getCustomerId(): string | null {
    return localStorage.getItem('customerId');
  }

  /**
   * Check if user is ADMIN
   */
  isAdmin(): boolean {
    const role = this.getUserRole();
    return role === 'ADMIN';
  }
  /**
   * Check if user is ADMIN
   */
  isManager(): boolean {
    const role = this.getUserRole();
    return role === 'BRANCH_MANAGER';
  }
  /**
   * Check if user is ADMIN
   */
  isLoan(): boolean {
    const role = this.getUserRole();
    return role === 'LOAN_OFFICER';
  }
  /**
   * Check if user is ADMIN
   */
  isCard(): boolean {
    const role = this.getUserRole();
    return role === 'CARD_OFFICER';
  }

  /**
   * Check if user is EMPLOYEE
   */
  isEmployee(): boolean {
    const role = this.getUserRole();
    return role === 'EMPLOYEE';
  }

  /**
   * Check if user is CUSTOMER
   */
  isCustomer(): boolean {
    const role = this.getUserRole();
    return role === 'CUSTOMER';
  }

  /**
   * Get username
   */
  getUsername(): string | null {
    return localStorage.getItem('username');
  }

  /**
   * Get email
   */
  getEmail(): string | null {
    return localStorage.getItem('email');
  }

  /**
   * Get full name
   */
  getFullName(): string | null {
    const firstName = localStorage.getItem('firstName');
    const lastName = localStorage.getItem('lastName');
    return firstName && lastName ? `${firstName} ${lastName}` : null;
  }

  /**
   * Map string role to UserRole enum
   */
  private mapStringToUserRole(roleString: string): UserRole {
    switch (roleString.toUpperCase()) {
      case 'ADMIN':
      return UserRole.ADMIN;
    case 'BRANCH_MANAGER':
      return UserRole.BRANCH_MANAGER;
    case 'LOAN_OFFICER':
      return UserRole.LOAN_OFFICER;
    case 'CARD_OFFICER':
      return UserRole.CARD_OFFICER;
    case 'EMPLOYEE':
      return UserRole.EMPLOYEE;
    case 'CUSTOMER':
      return UserRole.CUSTOMER;
    default:
      return UserRole.CUSTOMER;
    }
  }
}