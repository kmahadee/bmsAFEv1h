import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    
    const currentUser = this.authService.currentUserValue;
    
    if (currentUser) {
      // User is logged in, check for role-based access
      const requiredRole = route.data['role'];
      
      if (requiredRole) {
        // Route requires specific role
        if (currentUser.role === requiredRole) {
          return true;
        } else {
          // User doesn't have required role, redirect to unauthorized page
          console.warn(`Access denied. Required role: ${requiredRole}, User role: ${currentUser.role}`);
          this.router.navigate(['/auth/login']);
          return false;
        }
      }
      
      // No specific role required, allow access
      return true;
    }

    // User is not logged in, redirect to login page with return URL
    console.warn('User not authenticated, redirecting to login');
    this.router.navigate(['/auth/login'], { 
      queryParams: { returnUrl: state.url } 
    });
    return false;
  }
}
