import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CustomerService } from 'src/app/core/services/customer.service';
import { CustomerUpdateRequest } from 'src/app/core/models/customer';

@Component({
  selector: 'app-customer-edit',
  templateUrl: './customer-edit.component.html',
  styleUrls: ['./customer-edit.component.scss']
})
export class CustomerEditComponent implements OnInit {
  customerForm!: FormGroup;
  loading = false;
  submitted = false;
  error = '';
  success = '';
  customerId!: number;

  constructor(
    private formBuilder: FormBuilder,
    private customerService: CustomerService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.customerId = Number(this.route.snapshot.paramMap.get('id'));
    
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
      status: [''],
      kycStatus: [''],
      image: ['']
    });

    this.loadCustomer();
  }

  get f() {
    return this.customerForm.controls;
  }

  loadCustomer(): void {
    this.loading = true;
    this.customerService.getCustomerById(this.customerId).subscribe({
      next: (response) => {
        const customer = response.data;
        this.customerForm.patchValue({
          firstName: customer.firstName,
          lastName: customer.lastName,
          email: customer.email,
          phone: customer.phone,
          dateOfBirth: customer.dateOfBirth,
          address: customer.address,
          city: customer.city,
          state: customer.state,
          zipCode: customer.zipCode,
          status: customer.status,
          kycStatus: customer.kycStatus,
          image: customer.image
        });
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading customer', error);
        this.loading = false;
      }
    });
  }

  onSubmit(): void {
    this.submitted = true;
    this.error = '';
    this.success = '';

    if (this.customerForm.invalid) {
      return;
    }

    this.loading = true;
    const customerData: CustomerUpdateRequest = this.customerForm.value;

    this.customerService.updateCustomer(this.customerId, customerData).subscribe({
      next: (response) => {
        this.success = 'Customer updated successfully!';
        setTimeout(() => {
          this.router.navigate(['/customer/detail', this.customerId]);
        }, 1500);
      },
      error: (error) => {
        this.error = error.error?.message || 'Failed to update customer. Please try again.';
        this.loading = false;
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/customer/detail', this.customerId]);
  }
}
