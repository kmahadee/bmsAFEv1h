import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from 'src/app/core/services/auth.service';


@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  loading = false;
  submitted = false;
  error = '';
  returnUrl = '';
  passwordVisible = false;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    // Redirect to dashboard if already logged in
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/dashboard']);
    }
  }

  ngOnInit(): void {
    this.loginForm = this.formBuilder.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });

    // Get return url from route parameters or default to dashboard
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
  }

  // Convenience getter for easy access to form fields
  get f() {
    return this.loginForm.controls;
  }

  togglePasswordVisibility(): void {
    this.passwordVisible = !this.passwordVisible;
  }

  onSubmit(): void {
    this.submitted = true;
    this.error = '';

    // Stop if form is invalid
    if (this.loginForm.invalid) {
      return;
    }

    this.loading = true;
    const { username, password } = this.loginForm.value;

    this.authService.login(username, password).subscribe({
      next: (success) => {
        if (success) {
          // Navigate based on user role
          if (this.authService.isAdmin()) {
            this.router.navigate(['/dashboard/admin-dashboard']);
          } else if (this.authService.isManager()) {
            this.router.navigate(['/dashboard/admin-dashboard']);
          } else if (this.authService.isLoan()) {
            this.router.navigate(['/loans/LoanDashboard']);
          } else if (this.authService.isCard()) {
            this.router.navigate(['/cards']);
          } else if (this.authService.isCustomer()) {
            this.router.navigate(['/dashboard/customer-dashboard']);
          } else {
            this.router.navigate([this.returnUrl]);
          }
        }
      },
      error: (error) => {
        this.error = 'Invalid username or password';
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  // Demo credentials helper
  fillDemoCredentials(role: 'admin' | 'customer'): void {
    if (role === 'admin') {
      this.loginForm.patchValue({
        username: 'admin',
        password: 'admin123'
      });
    } else {
      this.loginForm.patchValue({
        username: 'sally',
        password: 'm12345'
      });
    }
  }

  managermain(){
    this.loginForm.patchValue({
        username: 'manager.main',
        password: 'manager123'
      });
  };
  managerdown(){
    this.loginForm.patchValue({
        username: 'manager.downtown',
        password: 'manager123'
      });
  };
}
