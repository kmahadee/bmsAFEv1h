import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiResponse } from 'src/app/core/models/api-response';
import { DPS } from 'src/app/core/models/dps';
import { DpsService } from 'src/app/core/services/dps.service';
import { AuthService } from 'src/app/core/services/auth.service';

@Component({
  selector: 'app-dps-list',
  templateUrl: './dps-list.component.html',
  styleUrls: ['./dps-list.component.scss']
})
export class DpsListComponent implements OnInit {
  dpsList: DPS[] = [];
  filteredDpsList: DPS[] = [];
  loading = false;
  error = '';
  searchTerm = '';
  selectedStatus = '';
  selectedCustomerId = '';

  // Status options for filter dropdown
  statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'matured', label: 'Matured' },
    { value: 'closed', label: 'Closed' },
    { value: 'defaulted', label: 'Defaulted' },
    { value: 'suspended', label: 'Suspended' }
  ];

  constructor(
    private dpsService: DpsService,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadDPS();
  }

  /**
   * Load DPS based on user role
   */
  loadDPS(): void {
    if (this.authService.isCustomer()) {
      this.loadCustomerDPS();
    } else {
      this.loadAllDPS();
    }
  }

  /**
   * Load DPS for current logged-in customer
   */
  loadCustomerDPS(): void {
    this.loading = true;
    this.error = '';
    
    const custId = this.authService.getCustomerId();
    
    if (custId) {
      this.dpsService.getDPSByCustomerId(custId).subscribe({
        next: (response: ApiResponse<DPS[]>) => {
          if (response.success && response.data) {
            this.dpsList = response.data;
            this.filteredDpsList = response.data;
            this.loading = false;
          }
        },
        error: (err) => {
          this.error = 'Failed to load DPS accounts. Please try again.';
          this.loading = false;
          console.error('Error loading DPS:', err);
        }
      });
    } else {
      this.error = 'No customer ID found in session. Ensure you are logged in as a Customer.';
      this.loading = false;
    }
  }

  /**
   * Load all DPS accounts (admin only)
   */
  loadAllDPS(): void {
    this.loading = true;
    this.error = '';
    
    this.dpsService.getAllDPS().subscribe({
      next: (response: ApiResponse<DPS[]>) => {
        if (response.success && response.data) {
          this.dpsList = response.data;
          this.filteredDpsList = response.data;
          this.loading = false;
        }
      },
      error: (err) => {
        this.error = 'Failed to load DPS accounts. Please try again.';
        this.loading = false;
        console.error('Error loading DPS:', err);
      }
    });
  }

  /**
   * Filter DPS by status
   */
  filterByStatus(): void {
    if (this.selectedStatus) {
      this.loading = true;
      this.error = '';
      
      this.dpsService.getDPSByStatus(this.selectedStatus).subscribe({
        next: (response: ApiResponse<DPS[]>) => {
          if (response.success && response.data) {
            this.filteredDpsList = response.data;
            this.loading = false;
          }
        },
        error: (err) => {
          this.error = 'Failed to filter DPS accounts by status.';
          this.loading = false;
          console.error('Error filtering DPS by status:', err);
        }
      });
    } else {
      this.filteredDpsList = this.dpsList;
    }
  }

  /**
   * Filter DPS by customer ID
   */
  filterByCustomer(): void {
    if (this.selectedCustomerId.trim()) {
      this.loading = true;
      this.error = '';
      
      this.dpsService.getDPSByCustomerId(this.selectedCustomerId.trim()).subscribe({
        next: (response: ApiResponse<DPS[]>) => {
          if (response.success && response.data) {
            this.filteredDpsList = response.data;
            this.loading = false;
          }
        },
        error: (err) => {
          this.error = 'Failed to filter DPS accounts by customer.';
          this.loading = false;
          console.error('Error filtering DPS by customer:', err);
        }
      });
    } else {
      this.filteredDpsList = this.dpsList;
    }
  }

  /**
   * Search DPS by number, customer name, or customer ID
   */
  searchDPS(): void {
    const term = this.searchTerm.toLowerCase().trim();
    
    if (term) {
      this.filteredDpsList = this.dpsList.filter(dps =>
        dps.dpsNumber.toLowerCase().includes(term) ||
        dps.customerName.toLowerCase().includes(term) ||
        dps.customerId.toLowerCase().includes(term)
      );
    } else {
      this.filteredDpsList = this.dpsList;
    }
  }

  /**
   * Clear all filters and show all DPS
   */
  clearFilters(): void {
    this.searchTerm = '';
    this.selectedStatus = '';
    this.selectedCustomerId = '';
    this.filteredDpsList = this.dpsList;
  }

  /**
   * Navigate to DPS details page
   */
  viewDetails(dpsNumber: string): void {
    this.router.navigate(['/dps/detail', dpsNumber]);
  }

  /**
   * Navigate to DPS statement page
   */
  viewStatement(dpsNumber: string): void {
    this.router.navigate(['/dps/statement', dpsNumber]);
  }

  /**
   * Navigate to DPS payment page
   */
  makePayment(dpsNumber: string): void {
    this.router.navigate(['/dps/payment', dpsNumber]);
  }

  /**
   * Navigate to create new DPS page
   */
  createNewDPS(): void {
    this.router.navigate(['/dps/create']);
  }

  /**
   * Get Bootstrap badge class based on status
   */
  getStatusBadgeClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      'active': 'badge bg-success',
      'matured': 'badge bg-primary',
      'closed': 'badge bg-secondary',
      'defaulted': 'badge bg-danger',
      'suspended': 'badge bg-warning text-dark'
    };
    return statusMap[status.toLowerCase()] || 'badge bg-secondary';
  }

  /**
   * Format currency
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  /**
   * Format date
   */
  formatDate(date: string | Date): string {
    if (!date) return '-';
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  /**
   * Get count of DPS by status
   */
  getCountByStatus(status: string): number {
    return this.filteredDpsList.filter(dps => 
      dps.status.toLowerCase() === status.toLowerCase()
    ).length;
  }

  /**
   * Get count of DPS with pending payments
   */
  getPendingPaymentsCount(): number {
    return this.filteredDpsList.filter(dps => 
      dps.pendingInstallments > 0 && dps.status === 'active'
    ).length;
  }

  /**
   * Get count of overdue DPS
   */
  getOverdueCount(): number {
    const today = new Date();
    return this.filteredDpsList.filter(dps => {
      if (!dps.nextPaymentDate || dps.status !== 'active') return false;
      const nextPayment = new Date(dps.nextPaymentDate);
      return nextPayment < today;
    }).length;
  }

  /**
   * Check if DPS is overdue
   */
  isOverdue(dps: DPS): boolean {
    if (!dps.nextPaymentDate || dps.status !== 'active') return false;
    const today = new Date();
    const nextPayment = new Date(dps.nextPaymentDate);
    return nextPayment < today;
  }

  /**
   * Refresh the list
   */
  refreshList(): void {
    this.clearFilters();
    this.loadDPS();
  }

  /**
   * Track by function for ngFor performance
   */
  trackByDpsNumber(index: number, item: DPS): string {
    return item.dpsNumber;
  }
}




// import { Component, OnInit } from '@angular/core';
// import { Router } from '@angular/router';
// import { ApiResponse } from 'src/app/core/models/api-response';
// import { DPS } from 'src/app/core/models/dps';
// import { DpsService } from 'src/app/core/services/dps.service';

// @Component({
//   selector: 'app-dps-list',
//   templateUrl: './dps-list.component.html',
//   styleUrls: ['./dps-list.component.scss']
// })
// export class DpsListComponent implements OnInit {
//   dpsList: DPS[] = [];
//   filteredDpsList: DPS[] = [];
//   loading = false;
//   error = '';
//   searchTerm = '';
//   selectedStatus = '';
//   selectedCustomerId = '';

//   // Status options for filter dropdown
//   statusOptions = [
//     { value: 'active', label: 'Active' },
//     { value: 'matured', label: 'Matured' },
//     { value: 'closed', label: 'Closed' },
//     { value: 'defaulted', label: 'Defaulted' },
//     { value: 'suspended', label: 'Suspended' }
//   ];

//   constructor(
//     private dpsService: DpsService,
//     private router: Router
//   ) { }

//   ngOnInit(): void {
//     this.loadAllDPS();
//   }

//   /**
//    * Load all DPS accounts
//    */
//   loadAllDPS(): void {
//     this.loading = true;
//     this.error = '';
    
//     this.dpsService.getAllDPS().subscribe({
//       next: (response: ApiResponse<DPS[]>) => {
//         if (response.success && response.data) {
//           this.dpsList = response.data;
//           this.filteredDpsList = response.data;
//           this.loading = false;
//         }
//       },
//       error: (err) => {
//         this.error = 'Failed to load DPS accounts. Please try again.';
//         this.loading = false;
//         console.error('Error loading DPS:', err);
//       }
//     });
//   }

//   /**
//    * Filter DPS by status
//    */
//   filterByStatus(): void {
//     if (this.selectedStatus) {
//       this.loading = true;
//       this.error = '';
      
//       this.dpsService.getDPSByStatus(this.selectedStatus).subscribe({
//         next: (response: ApiResponse<DPS[]>) => {
//           if (response.success && response.data) {
//             this.filteredDpsList = response.data;
//             this.loading = false;
//           }
//         },
//         error: (err) => {
//           this.error = 'Failed to filter DPS accounts by status.';
//           this.loading = false;
//           console.error('Error filtering DPS by status:', err);
//         }
//       });
//     } else {
//       this.filteredDpsList = this.dpsList;
//     }
//   }

//   /**
//    * Filter DPS by customer ID
//    */
//   filterByCustomer(): void {
//     if (this.selectedCustomerId.trim()) {
//       this.loading = true;
//       this.error = '';
      
//       this.dpsService.getDPSByCustomerId(this.selectedCustomerId.trim()).subscribe({
//         next: (response: ApiResponse<DPS[]>) => {
//           if (response.success && response.data) {
//             this.filteredDpsList = response.data;
//             this.loading = false;
//           }
//         },
//         error: (err) => {
//           this.error = 'Failed to filter DPS accounts by customer.';
//           this.loading = false;
//           console.error('Error filtering DPS by customer:', err);
//         }
//       });
//     } else {
//       this.filteredDpsList = this.dpsList;
//     }
//   }

//   /**
//    * Search DPS by number, customer name, or customer ID
//    */
//   searchDPS(): void {
//     const term = this.searchTerm.toLowerCase().trim();
    
//     if (term) {
//       this.filteredDpsList = this.dpsList.filter(dps =>
//         dps.dpsNumber.toLowerCase().includes(term) ||
//         dps.customerName.toLowerCase().includes(term) ||
//         dps.customerId.toLowerCase().includes(term)
//       );
//     } else {
//       this.filteredDpsList = this.dpsList;
//     }
//   }

//   /**
//    * Clear all filters and show all DPS
//    */
//   clearFilters(): void {
//     this.searchTerm = '';
//     this.selectedStatus = '';
//     this.selectedCustomerId = '';
//     this.filteredDpsList = this.dpsList;
//   }

//   /**
//    * Navigate to DPS details page
//    */
//   viewDetails(dpsNumber: string): void {
//     this.router.navigate(['/dps/detail', dpsNumber]);
//   }

//   /**
//    * Navigate to DPS statement page
//    */
//   viewStatement(dpsNumber: string): void {
//     this.router.navigate(['/dps/statement', dpsNumber]);
//   }

//   /**
//    * Navigate to DPS payment page
//    */
//   makePayment(dpsNumber: string): void {
//     this.router.navigate(['/dps/payment', dpsNumber]);
//   }

//   /**
//    * Navigate to create new DPS page
//    */
//   createNewDPS(): void {
//     this.router.navigate(['/dps/create']);
//   }

//   /**
//    * Get Bootstrap badge class based on status
//    */
//   getStatusBadgeClass(status: string): string {
//     const statusMap: { [key: string]: string } = {
//       'active': 'badge bg-success',
//       'matured': 'badge bg-primary',
//       'closed': 'badge bg-secondary',
//       'defaulted': 'badge bg-danger',
//       'suspended': 'badge bg-warning text-dark'
//     };
//     return statusMap[status.toLowerCase()] || 'badge bg-secondary';
//   }

//   /**
//    * Format currency
//    */
//   formatCurrency(amount: number): string {
//     return new Intl.NumberFormat('en-US', {
//       style: 'currency',
//       currency: 'USD',
//       minimumFractionDigits: 2,
//       maximumFractionDigits: 2
//     }).format(amount);
//   }

//   /**
//    * Format date
//    */
//   formatDate(date: string | Date): string {
//     if (!date) return '-';
    
//     const dateObj = typeof date === 'string' ? new Date(date) : date;
    
//     return dateObj.toLocaleDateString('en-US', {
//       year: 'numeric',
//       month: 'short',
//       day: 'numeric'
//     });
//   }

//   /**
//    * Get count of DPS by status
//    */
//   getCountByStatus(status: string): number {
//     return this.filteredDpsList.filter(dps => 
//       dps.status.toLowerCase() === status.toLowerCase()
//     ).length;
//   }

//   /**
//    * Get count of DPS with pending payments
//    */
//   getPendingPaymentsCount(): number {
//     return this.filteredDpsList.filter(dps => 
//       dps.pendingInstallments > 0 && dps.status === 'active'
//     ).length;
//   }

//   /**
//    * Get count of overdue DPS
//    */
//   getOverdueCount(): number {
//     const today = new Date();
//     return this.filteredDpsList.filter(dps => {
//       if (!dps.nextPaymentDate || dps.status !== 'active') return false;
//       const nextPayment = new Date(dps.nextPaymentDate);
//       return nextPayment < today;
//     }).length;
//   }

//   /**
//    * Check if DPS is overdue
//    */
//   isOverdue(dps: DPS): boolean {
//     if (!dps.nextPaymentDate || dps.status !== 'active') return false;
//     const today = new Date();
//     const nextPayment = new Date(dps.nextPaymentDate);
//     return nextPayment < today;
//   }

//   /**
//    * Refresh the list
//    */
//   refreshList(): void {
//     this.clearFilters();
//     this.loadAllDPS();
//   }

//   /**
//    * Track by function for ngFor performance
//    */
//   trackByDpsNumber(index: number, item: DPS): string {
//     return item.dpsNumber;
//   }
// }
