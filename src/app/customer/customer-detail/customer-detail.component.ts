import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CustomerService } from 'src/app/core/services/customer.service';
import { AccountService } from 'src/app/core/services/account.service';
import { Customer } from 'src/app/core/models/customer';

@Component({
  selector: 'app-customer-detail',
  templateUrl: './customer-detail.component.html',
  styleUrls: ['./customer-detail.component.scss']
})
export class CustomerDetailComponent implements OnInit {
  customer: Customer | null = null;
  accounts: any[] = [];
  loading = false;
  customerId!: number;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private customerService: CustomerService,
    private accountService: AccountService
  ) { }

  ngOnInit(): void {
    this.customerId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadCustomerDetails();
  }

  loadCustomerDetails(): void {
    this.loading = true;

    this.customerService.getCustomerById(this.customerId).subscribe({
      next: (response) => {
        this.customer = response.data;
        this.loadAccounts(response.data.customerId);
      },
      error: (error) => {
        console.error('Error loading customer', error);
        this.loading = false;
      }
    });
  }

  loadAccounts(customerId: string): void {
    this.accountService.getAccountsByCustomerId(customerId).subscribe({
      next: (response) => {
        this.accounts = response.data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading accounts', error);
        this.loading = false;
      }
    });
  }

  editCustomer(): void {
    this.router.navigate(['/customer/edit', this.customerId]);
  }

  deleteCustomer(): void {
    if (confirm('Are you sure you want to delete this customer?')) {
      this.customerService.deleteCustomer(this.customerId).subscribe({
        next: () => {
          this.router.navigate(['/customer/list']);
        },
        error: (error) => console.error('Error deleting customer', error)
      });
    }
  }

  updateKycStatus(status: string): void {
    if (this.customer) {
      this.customerService.updateKycStatus(this.customer.customerId, status).subscribe({
        next: () => {
          this.loadCustomerDetails();
        },
        error: (error) => console.error('Error updating KYC status', error)
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/customer/list']);
  }
}

