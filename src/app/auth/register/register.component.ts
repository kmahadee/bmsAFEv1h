import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { RegisterRequest } from 'src/app/core/models/RegisterRequest';
import { AuthService } from 'src/app/core/services/auth.service';


@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  loading = false;
  submitted = false;
  error = '';
  success = '';
  passwordVisible = false;
  confirmPasswordVisible = false;

  // US States
  states = [
    'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado',
    'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho',
    'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana',
    'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota',
    'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada',
    'New Hampshire', 'New Jersey', 'New Mexico', 'New York',
    'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon',
    'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
    'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington',
    'West Virginia', 'Wisconsin', 'Wyoming'
  ];

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.initializeForm();
  }

  initializeForm(): void {
    this.registerForm = this.formBuilder.group({
      // Personal Information
      firstName: ['', [
        Validators.required, 
        Validators.minLength(2),
        Validators.maxLength(50)
      ]],
      lastName: ['', [
        Validators.required, 
        Validators.minLength(2),
        Validators.maxLength(50)
      ]],
      email: ['', [
        Validators.required, 
        Validators.email,
        Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
      ]],
      phone: ['', [
        Validators.required, 
        Validators.pattern(/^\+?[1-9]\d{1,14}$/)
      ]],
      dateOfBirth: ['', [
        Validators.required,
        this.dateOfBirthValidator
      ]],
      
      // Address Information
      address: ['', [
        Validators.required, 
        Validators.minLength(5),
        Validators.maxLength(255)
      ]],
      city: ['', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(50)
      ]],
      state: ['', Validators.required],
      zipCode: ['', [
        Validators.required, 
        Validators.pattern(/^\d{3,10}$/)
      ]],
      
      // Optional Image
      image: [''],
      
      // Account Credentials
      username: ['', [
        Validators.required, 
        Validators.minLength(4),
        Validators.maxLength(50),
        Validators.pattern(/^[a-zA-Z0-9_-]+$/)
      ]],
      password: ['', [
        Validators.required, 
        Validators.minLength(6)
      ]],
      confirmPassword: ['', Validators.required],
      
      // Terms and Conditions
      agreeTerms: [false, Validators.requiredTrue]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  // Convenience getter for easy access to form fields
  get f() {
    return this.registerForm.controls;
  }

  // Custom validator for password match
  passwordMatchValidator(group: FormGroup) {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  // Custom validator for date of birth (must be 18+ years old)
  dateOfBirthValidator(control: any) {
    if (!control.value) return null;
    
    const birthDate = new Date(control.value);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age >= 18 ? null : { underage: true };
  }

  togglePasswordVisibility(field: 'password' | 'confirmPassword'): void {
    if (field === 'password') {
      this.passwordVisible = !this.passwordVisible;
    } else {
      this.confirmPasswordVisible = !this.confirmPasswordVisible;
    }
  }

  onSubmit(): void {
    this.submitted = true;
    this.error = '';
    this.success = '';

    // Stop if form is invalid
    if (this.registerForm.invalid) {
      // Scroll to first error
      const firstError = document.querySelector('.is-invalid');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    this.loading = true;

    // Prepare data for backend
    const formValue = this.registerForm.value;
    
    // Format date to YYYY-MM-DD format
    const dateOfBirth = new Date(formValue.dateOfBirth);
    const formattedDate = dateOfBirth.toISOString().split('T')[0];

    // Create registration request
    const registerRequest: RegisterRequest = {
      firstName: formValue.firstName.trim(),
      lastName: formValue.lastName.trim(),
      email: formValue.email.trim().toLowerCase(),
      phone: formValue.phone.trim(),
      dateOfBirth: formattedDate,
      address: formValue.address.trim(),
      city: formValue.city.trim(),
      state: formValue.state,
      zipCode: formValue.zipCode.trim(),
      username: formValue.username.trim(),
      password: formValue.password
    };

    // Add image if provided
    if (formValue.image && formValue.image.trim()) {
      registerRequest.image = formValue.image.trim();
    }

    // Call auth service register method
    this.authService.register(registerRequest).subscribe({
      next: (response) => {
        console.log('Registration successful:', response);
        this.success = 'Registration successful! Your customer ID is ' + response.customerId + '. Redirecting to login...';
        this.loading = false;
        
        // Clear form
        this.registerForm.reset();
        this.submitted = false;
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          this.router.navigate(['/auth/login'], {
            queryParams: { 
              registered: 'true', 
              username: registerRequest.username 
            }
          });
        }, 3000);
      },
      error: (error) => {
        console.error('Registration error:', error);
        this.loading = false;
        
        // Handle specific error messages
        if (error.message) {
          this.error = error.message;
        } else if (error.status === 409) {
          this.error = 'Username or email already exists. Please use different credentials.';
        } else if (error.status === 400) {
          this.error = 'Invalid data provided. Please check all fields and try again.';
        } else if (error.status === 0) {
          this.error = 'Unable to connect to server. Please check your connection.';
        } else {
          this.error = 'Registration failed. Please try again later.';
        }
      }
    });
  }

  onReset(): void {
    this.submitted = false;
    this.error = '';
    this.success = '';
    this.registerForm.reset({
      agreeTerms: false
    });
  }
}