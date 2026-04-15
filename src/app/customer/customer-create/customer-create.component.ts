import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CustomerService } from 'src/app/core/services/customer.service';
import { CustomerCreateRequest } from 'src/app/core/models/customer';

@Component({
  selector: 'app-customer-create',
  templateUrl: './customer-create.component.html',
  styleUrls: ['./customer-create.component.scss']
})
export class CustomerCreateComponent implements OnInit {
  customerForm!: FormGroup;
  loading = false;
  submitted = false;
  error = '';
  success = '';
  passwordVisible = false;

  constructor(
    private formBuilder: FormBuilder,
    private customerService: CustomerService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.customerForm = this.formBuilder.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^\+?[1-9]\d{1,14}$/)]],
      dateOfBirth: ['', Validators.required],
      address: ['', [Validators.required, Validators.minLength(5)]],
      city: ['', Validators.required],
      state: ['', Validators.required],
      zipCode: ['', [Validators.required, Validators.pattern(/^\d{3,10}$/)]],
      username: ['', [Validators.required, Validators.minLength(4)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      image: ['']
    });
  }

  get f() {
    return this.customerForm.controls;
  }

  togglePasswordVisibility(): void {
    this.passwordVisible = !this.passwordVisible;
  }

  onSubmit(): void {
    this.submitted = true;
    this.error = '';
    this.success = '';

    if (this.customerForm.invalid) {
      return;
    }

    this.loading = true;
    const customerData: CustomerCreateRequest = this.customerForm.value;

    this.customerService.createCustomer(customerData).subscribe({
      next: (response) => {
        this.success = 'Customer created successfully!';
        setTimeout(() => {
          this.router.navigate(['/customer/detail', response.data.id]);
        }, 1500);
      },
      error: (error) => {
        this.error = error.error?.message || 'Failed to create customer. Please try again.';
        this.loading = false;
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/customer/list']);
  }
}
