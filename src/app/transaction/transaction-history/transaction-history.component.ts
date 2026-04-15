import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AccountService } from 'src/app/core/services/account.service';
import { AuthService } from 'src/app/core/services/auth.service';


@Component({
  selector: 'app-transaction-history',
  templateUrl: './transaction-history.component.html',
  styleUrls: ['./transaction-history.component.scss']
})
export class TransactionHistoryComponent implements OnInit {
  transactions: any[] = [];
  filteredTransactions: any[] = [];
  loading = false;
  myAccounts: any[] = [];
  selectedAccountNumber = '';
  selectedType = 'all';
  searchTerm = '';

  constructor(
    private accountService: AccountService,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadMyAccounts();
  }

  loadMyAccounts(): void {
    // Get customer ID directly from auth service
    const custId = this.authService.getCustomerId();

    if (custId) {
      this.accountService.getAccountsByCustomerId(custId).subscribe({
        next: (accountResponse) => {
          this.myAccounts = accountResponse.data;
          if (this.myAccounts.length > 0) {
            this.selectedAccountNumber = this.myAccounts[0].accountNumber;
            this.loadTransactions();
          }
        },
        error: (error) => {
          console.error('Error loading accounts', error);
        }
      });
    } else {
      console.error('No customer ID found in session. Ensure you are logged in as a Customer.');
    }
  }

  loadTransactions(): void {
    if (!this.selectedAccountNumber) return;

    this.loading = true;
    
    // Get account statement for the last 90 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 90);

    const request = {
      accountNumber: this.selectedAccountNumber,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    };

    this.accountService.getAccountStatement(request).subscribe({
      next: (response) => {
        this.transactions = response.data.transactions || [];
        this.filteredTransactions = this.transactions;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading transactions', error);
        this.loading = false;
      }
    });
  }

  onAccountChange(): void {
    this.loadTransactions();
  }

  onSearch(): void {
    this.applyFilters();
  }

  onTypeChange(): void {
    this.applyFilters();
  }

  applyFilters(): void {
    let filtered = [...this.transactions];

    // Filter by type
    if (this.selectedType !== 'all') {
      filtered = filtered.filter(txn => txn.transactionType === this.selectedType);
    }

    // Filter by search term
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(txn =>
        txn.transactionId.toLowerCase().includes(term) ||
        txn.referenceNumber?.toLowerCase().includes(term) ||
        txn.description?.toLowerCase().includes(term) ||
        txn.otherAccountNumber?.toLowerCase().includes(term)
      );
    }

    this.filteredTransactions = filtered;
  }

  getTransactionIcon(type: string): string {
    switch (type) {
      case 'DEBIT':
        return 'bi-arrow-up-right text-danger';
      case 'CREDIT':
        return 'bi-arrow-down-left text-success';
      default:
        return 'bi-arrow-left-right text-primary';
    }
  }

  viewStatement(): void {
    if (this.selectedAccountNumber) {
      this.router.navigate(['/account/statement', this.selectedAccountNumber]);
    }
  }
}







// import { Component, OnInit } from '@angular/core';
// import { Router } from '@angular/router';
// import { AccountService } from 'src/app/core/services/account.service';
// import { AuthService } from 'src/app/core/services/auth.service';
// import { CustomerService } from 'src/app/core/services/customer.service';
// import { FilterPipe } from 'src/app/core/services/filter.pipe';


// @Component({
//   selector: 'app-transaction-history',
//   templateUrl: './transaction-history.component.html',
//   styleUrls: ['./transaction-history.component.scss']
// })
// export class TransactionHistoryComponent implements OnInit {
//   transactions: any[] = [];
//   filteredTransactions: any[] = [];
//   loading = false;
//   myAccounts: any[] = [];
//   selectedAccountNumber = '';
//   selectedType = 'all';
//   searchTerm = '';

//   constructor(
//     private accountService: AccountService,
//     private authService: AuthService,
//     private customerService: CustomerService,
//     private router: Router,
//     private filter: FilterPipe
//   ) { }

//   ngOnInit(): void {
//     this.loadMyAccounts();
//   }

//   loadMyAccounts(): void {
//     const user = this.authService.currentUserValue;
//     if (user?.id) {
//       this.customerService.getCustomerById(user.id).subscribe({
//         next: (response) => {
//           const customerId = response.data.customerId;
//           this.accountService.getAccountsByCustomerId(customerId).subscribe({
//             next: (accountResponse) => {
//               this.myAccounts = accountResponse.data;
//               if (this.myAccounts.length > 0) {
//                 this.selectedAccountNumber = this.myAccounts[0].accountNumber;
//                 this.loadTransactions();
//               }
//             },
//             error: (error) => console.error('Error loading accounts', error)
//           });
//         },
//         error: (error) => console.error('Error loading customer', error)
//       });
//     }
//   }

//   loadTransactions(): void {
//     if (!this.selectedAccountNumber) return;

//     this.loading = true;
    
//     // Get account statement for the last 90 days
//     const endDate = new Date();
//     const startDate = new Date();
//     startDate.setDate(startDate.getDate() - 90);

//     const request = {
//       accountNumber: this.selectedAccountNumber,
//       startDate: startDate.toISOString(),
//       endDate: endDate.toISOString()
//     };

//     this.accountService.getAccountStatement(request).subscribe({
//       next: (response) => {
//         this.transactions = response.data.transactions || [];
//         this.filteredTransactions = this.transactions;
//         this.loading = false;
//       },
//       error: (error) => {
//         console.error('Error loading transactions', error);
//         this.loading = false;
//       }
//     });
//   }

//   onAccountChange(): void {
//     this.loadTransactions();
//   }

//   onSearch(): void {
//     this.applyFilters();
//   }

//   onTypeChange(): void {
//     this.applyFilters();
//   }

//   applyFilters(): void {
//     let filtered = [...this.transactions];

//     // Filter by type
//     if (this.selectedType !== 'all') {
//       filtered = filtered.filter(txn => txn.transactionType === this.selectedType);
//     }

//     // Filter by search term
//     if (this.searchTerm.trim()) {
//       const term = this.searchTerm.toLowerCase();
//       filtered = filtered.filter(txn =>
//         txn.transactionId.toLowerCase().includes(term) ||
//         txn.referenceNumber?.toLowerCase().includes(term) ||
//         txn.description?.toLowerCase().includes(term) ||
//         txn.otherAccountNumber?.toLowerCase().includes(term)
//       );
//     }

//     this.filteredTransactions = filtered;
//   }

//   getTransactionIcon(type: string): string {
//     switch (type) {
//       case 'DEBIT':
//         return 'bi-arrow-up-right text-danger';
//       case 'CREDIT':
//         return 'bi-arrow-down-left text-success';
//       default:
//         return 'bi-arrow-left-right text-primary';
//     }
//   }

//   viewStatement(): void {
//     if (this.selectedAccountNumber) {
//       this.router.navigate(['/account/statement', this.selectedAccountNumber]);
//     }
//   }
// }

