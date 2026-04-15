import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CustomerService } from 'src/app/core/services/customer.service';
import { CustomerListItem } from 'src/app/core/models/customer';


@Component({
  selector: 'app-customer-list',
  templateUrl: './customer-list.component.html',
  styleUrls: ['./customer-list.component.scss']
})
export class CustomerListComponent implements OnInit {
  customers: CustomerListItem[] = [];
  filteredCustomers: CustomerListItem[] = [];
  loading = false;
  searchTerm = '';
  selectedStatus = 'all';
  selectedKycStatus = 'all';

  constructor(
    private customerService: CustomerService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadCustomers();
  }

  loadCustomers(): void {
    this.loading = true;
    this.customerService.getAllCustomers().subscribe({
      next: (response) => {
        this.customers = response.data;
        this.filteredCustomers = this.customers;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading customers', error);
        this.loading = false;
      }
    });
  }

  onSearch(): void {
    if (!this.searchTerm.trim()) {
      this.applyFilters();
      return;
    }

    this.customerService.searchCustomers(this.searchTerm).subscribe({
      next: (response) => {
        this.filteredCustomers = response.data;
      },
      error: (error) => console.error('Error searching customers', error)
    });
  }

  applyFilters(): void {
    this.filteredCustomers = this.customers.filter(customer => {
      const statusMatch = this.selectedStatus === 'all' || customer.status === this.selectedStatus;
      const kycMatch = this.selectedKycStatus === 'all' || customer.kycStatus === this.selectedKycStatus;
      return statusMatch && kycMatch;
    });
  }

  onStatusChange(): void {
    this.applyFilters();
  }

  onKycStatusChange(): void {
    this.applyFilters();
  }

  viewCustomer(id: number): void {
    this.router.navigate(['/customer/detail', id]);
  }

  editCustomer(id: number): void {
    this.router.navigate(['/customer/edit', id]);
  }

  deleteCustomer(id: number): void {
    if (confirm('Are you sure you want to delete this customer?')) {
      this.customerService.deleteCustomer(id).subscribe({
        next: () => {
          this.loadCustomers();
        },
        error: (error) => console.error('Error deleting customer', error)
      });
    }
  }

  createCustomer(): void {
    this.router.navigate(['/auth/register']);
  }
}